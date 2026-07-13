import { GoogleGenAI, createPartFromUri, createUserContent, Type } from "@google/genai";
import type { GenerateContentParameters } from "@google/genai";
import { readFile, stat } from "node:fs/promises";
import type { SummaryResult } from "@/agents/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TEXT_MODEL = "gemini-3.1-flash-lite";

const INLINE_UPLOAD_THRESHOLD_BYTES = 15 * 1024 * 1024; // stay well under the 20MB inline request limit

// Gemini's free tier caps gemini-2.5-flash at 5 requests/minute. Every call in this module goes
// through generateContentWithRateLimit so transcription (audio fallback) and summarization share
// one process-wide pacing queue instead of independently bursting past the quota.
const MAX_REQUESTS_PER_WINDOW = 4; // stay under the 5/min free-tier cap with headroom for clock skew
const WINDOW_MS = 60_000;
const recentCallTimestamps: number[] = [];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRateLimitSlot() {
  while (true) {
    const now = Date.now();
    while (recentCallTimestamps.length && now - recentCallTimestamps[0] > WINDOW_MS) {
      recentCallTimestamps.shift();
    }
    if (recentCallTimestamps.length < MAX_REQUESTS_PER_WINDOW) {
      recentCallTimestamps.push(now);
      return;
    }
    await sleep(WINDOW_MS - (now - recentCallTimestamps[0]) + 250);
  }
}

/** Parses Gemini's `"retryDelay":"41s"` hint out of a 429 error message, if present. */
function extractRetryDelayMs(err: unknown): number | null {
  const message = err instanceof Error ? err.message : String(err);
  const match = message.match(/"retryDelay":"(\d+(?:\.\d+)?)s"/);
  return match ? Math.ceil(parseFloat(match[1]) * 1000) : null;
}

// 429 = our client-side window didn't perfectly match Google's actual quota window; 503 = transient
// "model experiencing high demand"; timeout = the request never got a response at all (e.g. the
// machine slept mid-connection). All three are worth retrying with backoff rather than failing the task.
function isRetryableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("503") ||
    message.includes("UNAVAILABLE") ||
    message.includes("PODCASTX_TIMEOUT")
  );
}

const REQUEST_TIMEOUT_MS = 90_000;

/** The Gemini SDK has no built-in timeout — without this, a stalled connection hangs forever. */
async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("PODCASTX_TIMEOUT: Gemini request timed out")), REQUEST_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function generateContentWithRateLimit(
  params: GenerateContentParameters,
  maxRetries = 5
) {
  for (let attempt = 0; ; attempt++) {
    await waitForRateLimitSlot();
    try {
      return await withTimeout(ai.models.generateContent(params));
    } catch (err) {
      if (!isRetryableError(err) || attempt >= maxRetries) throw err;
      await sleep((extractRetryDelayMs(err) ?? 2 ** attempt * 1000) + 250);
    }
  }
}

/** Transcribes an audio file via Gemini's native audio understanding (used as the no-captions fallback). */
export async function transcribeAudio(filePath: string, mimeType = "audio/mpeg"): Promise<string> {
  const { size } = await stat(filePath);

  const audioPart =
    size <= INLINE_UPLOAD_THRESHOLD_BYTES
      ? { inlineData: { data: (await readFile(filePath)).toString("base64"), mimeType } }
      : createPartFromUri((await ai.files.upload({ file: filePath, config: { mimeType } })).uri!, mimeType);

  const response = await generateContentWithRateLimit({
    model: TEXT_MODEL,
    contents: createUserContent([
      "Transcribe this audio in full. Return only the spoken transcript text, no commentary or timestamps.",
      audioPart,
    ]),
  });

  return response.text ?? "";
}

const SUMMARY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    notableQuotes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          quote: { type: Type.STRING },
          speaker: { type: Type.STRING },
        },
        required: ["quote"],
      },
    },
    topics: { type: Type.ARRAY, items: { type: Type.STRING } },
    summaryText: { type: Type.STRING },
  },
  required: ["keyPoints", "notableQuotes", "topics", "summaryText"],
};

/** Agent 4's underlying call: produces a structured summary of a transcript via Gemini JSON mode. */
export async function summarizeTranscript(transcript: string): Promise<SummaryResult> {
  const response = await generateContentWithRateLimit({
    model: TEXT_MODEL,
    contents: `Summarize this podcast/interview transcript for someone deciding whether to watch it.\n\nTranscript:\n${transcript}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: SUMMARY_SCHEMA,
    },
  });

  return JSON.parse(response.text ?? "{}") as SummaryResult;
}

export interface TranslatableContent {
  title: string;
  summaryText: string | null;
  keyPoints: string[] | null;
  notableQuotes: { quote: string; speaker?: string }[] | null;
  topics: string[] | null;
}

/**
 * Builds a translation response schema that only marks fields as present/required when the
 * input actually has content for them — otherwise Gemini sometimes returns null for a populated
 * array field (e.g. notableQuotes) instead of translating it, since a `nullable: true` schema
 * makes omitting the field a valid response even when the source data wasn't null.
 */
function buildTranslationSchema(content: TranslatableContent) {
  const properties: Record<string, unknown> = { title: { type: Type.STRING } };
  const required = ["title"];

  if (content.summaryText !== null) {
    properties.summaryText = { type: Type.STRING };
    required.push("summaryText");
  }
  if (content.keyPoints !== null) {
    properties.keyPoints = { type: Type.ARRAY, items: { type: Type.STRING } };
    required.push("keyPoints");
  }
  if (content.notableQuotes !== null) {
    properties.notableQuotes = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { quote: { type: Type.STRING }, speaker: { type: Type.STRING, nullable: true } },
        required: ["quote"],
      },
    };
    required.push("notableQuotes");
  }
  if (content.topics !== null) {
    properties.topics = { type: Type.ARRAY, items: { type: Type.STRING } };
    required.push("topics");
  }

  return { type: Type.OBJECT, properties, required };
}

/** Translates a video's title + summary fields into `targetLanguageName` (e.g. "Spanish"), used for the per-video translate feature. */
export async function translateContent(
  content: TranslatableContent,
  targetLanguageName: string
): Promise<TranslatableContent> {
  const response = await generateContentWithRateLimit({
    model: TEXT_MODEL,
    contents: `Translate every field below into ${targetLanguageName}. Every field present in this JSON has real content and must be translated in full — do not omit, shorten, or drop any array item; the output arrays must have exactly the same number of items as the input. Keep speaker names in notableQuotes unchanged (do not translate proper names).\n\n${JSON.stringify(content, null, 2)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: buildTranslationSchema(content),
      maxOutputTokens: 4096,
    },
  });

  return JSON.parse(response.text ?? "{}") as TranslatableContent;
}

const TITLES_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    titles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { id: { type: Type.STRING }, title: { type: Type.STRING } },
        required: ["id", "title"],
      },
    },
  },
  required: ["titles"],
};

/** Translates just the titles of many videos in a single call — used to localize titles shown in browsing lists (cards, hosts, recently saved), as opposed to the fuller per-video translateContent used when a summary panel is opened. */
export async function translateTitlesBulk(
  items: { id: string; title: string }[],
  targetLanguageName: string
): Promise<{ id: string; title: string }[]> {
  if (items.length === 0) return [];

  const response = await generateContentWithRateLimit({
    model: TEXT_MODEL,
    contents: `Translate each "title" below into ${targetLanguageName}, keeping the same "id" unchanged. Return every item in the input — do not skip any.\n\n${JSON.stringify(items, null, 2)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: TITLES_SCHEMA,
      maxOutputTokens: 4096,
    },
  });

  const parsed = JSON.parse(response.text ?? "{}") as { titles?: { id: string; title: string }[] };
  return parsed.titles ?? [];
}
