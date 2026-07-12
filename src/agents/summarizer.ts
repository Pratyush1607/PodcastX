import { summarizeTranscript } from "@/lib/gemini";
import type { SummaryResult } from "@/agents/types";

/** Agent 4: produces a structured summary (key points, quotes, topics) from a transcript. */
export async function summarizer(transcriptContent: string): Promise<SummaryResult> {
  return summarizeTranscript(transcriptContent);
}
