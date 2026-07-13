// Regenerates every non-English UI dictionary in src/locales/ from src/locales/en.json via Gemini.
// Run with: node --env-file=.env.local scripts/generateLocales.mjs
// Re-run this whenever new keys are added to en.json to keep the other 14 languages in sync.
import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync } from "node:fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const en = JSON.parse(readFileSync("src/locales/en.json", "utf8"));

const LANGUAGE_NAMES = {
  es: "Spanish",
  hi: "Hindi",
  id: "Indonesian",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  ar: "Arabic",
  ja: "Japanese",
  ko: "Korean",
  zh: "Simplified Chinese",
  ru: "Russian",
  it: "Italian",
  tr: "Turkish",
  vi: "Vietnamese",
};

const codes = Object.keys(LANGUAGE_NAMES);
const BATCH_SIZE = 4;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

for (const batch of chunk(codes, BATCH_SIZE)) {
  const languageList = batch.map((c) => `"${c}" (${LANGUAGE_NAMES[c]})`).join(", ");
  const prompt = `You are translating a web app's UI string dictionary (JSON) into ${batch.length} languages: ${languageList}.

Source (English) JSON:
${JSON.stringify(en, null, 2)}

Return ONLY a single JSON object whose top-level keys are exactly the language codes ${batch.map((c) => `"${c}"`).join(", ")}, and whose values are each a translated copy of the ENTIRE source JSON with the exact same nested keys/structure, translated naturally into that language. Keep any "{placeholder}" tokens (e.g. "{kind}", "{rank}") unchanged/untranslated — they are variable substitutions, not literal text. Do not add, remove, or rename any keys. Do not include markdown fences or commentary, only the raw JSON object.`;

  console.log(`Translating batch: ${batch.join(", ")}...`);
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const parsed = JSON.parse(response.text ?? "{}");
  for (const code of batch) {
    if (!parsed[code]) {
      console.error(`  MISSING locale ${code} in response, skipping`);
      continue;
    }
    writeFileSync(`src/locales/${code}.json`, JSON.stringify(parsed[code], null, 2) + "\n");
    console.log(`  wrote src/locales/${code}.json`);
  }
}

console.log("Done.");
