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
