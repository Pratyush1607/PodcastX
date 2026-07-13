import { fetchCaptions } from "@/lib/captions";
import { transcribeYoutubeUrl } from "@/lib/gemini";
import type { TranscriptResult } from "@/agents/types";

/** Agent 3: captions first, falling back to Gemini transcribing the YouTube video directly. */
export async function transcriber(youtubeVideoId: string): Promise<TranscriptResult> {
  const captions = await fetchCaptions(youtubeVideoId);
  if (captions) {
    return { source: "captions", language: captions.language, content: captions.content };
  }

  const content = await transcribeYoutubeUrl(`https://www.youtube.com/watch?v=${youtubeVideoId}`);
  return { source: "audio_gemini", content };
}
