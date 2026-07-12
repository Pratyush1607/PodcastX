import { fetchCaptions } from "@/lib/captions";
import { downloadAudio } from "@/lib/ytDlp";
import { transcribeAudio } from "@/lib/gemini";
import type { TranscriptResult } from "@/agents/types";

/** Agent 3: captions first, falling back to yt-dlp audio download + Gemini audio transcription. */
export async function transcriber(youtubeVideoId: string): Promise<TranscriptResult> {
  const captions = await fetchCaptions(youtubeVideoId);
  if (captions) {
    return { source: "captions", language: captions.language, content: captions.content };
  }

  const { filePath, cleanup } = await downloadAudio(youtubeVideoId);
  try {
    const content = await transcribeAudio(filePath);
    return { source: "audio_gemini", content };
  } finally {
    await cleanup();
  }
}
