import { YoutubeTranscript } from "youtube-transcript";

export interface CaptionResult {
  content: string;
  language?: string;
}

/**
 * Best-effort caption fetch via YouTube's public timedtext endpoint (unofficial, no OAuth).
 * Returns null if no caption track exists so the caller can fall back to audio transcription.
 */
const FETCH_TIMEOUT_MS = 30_000;

export async function fetchCaptions(youtubeVideoId: string): Promise<CaptionResult | null> {
  try {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("caption fetch timed out")), FETCH_TIMEOUT_MS);
    });
    const segments = await Promise.race([YoutubeTranscript.fetchTranscript(youtubeVideoId), timeout]);
    if (segments.length === 0) return null;
    return {
      content: segments.map((s) => s.text).join(" "),
      language: segments[0]?.lang,
    };
  } catch {
    return null;
  }
}
