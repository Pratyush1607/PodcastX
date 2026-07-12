import { CATEGORY_SLUGS, type CategorySlug, type ContentType, type TranscriptSource } from "@/types/db";

// Each scope costs ~2 Gemini calls/video (summarize + occasional audio-fallback transcription) x 2
// content types x top-5. On a restrictive free-tier Gemini quota (as low as 20 requests/day per
// model on some projects), only 'overall' fits with headroom. Set GEMINI_FREE_TIER_MODE=false in
// .env.local once billing is enabled (or the quota is otherwise sufficient) to research all 6 categories again.
export const ALL_SCOPES: CategorySlug[] =
  process.env.GEMINI_FREE_TIER_MODE === "false" ? ["overall", ...CATEGORY_SLUGS] : ["overall"];

export interface VideoCandidate {
  youtubeVideoId: string;
  title: string;
  channelName: string;
  url: string;
  viewCount: number;
  publishedAt: string;
  thumbnailUrl?: string;
}

export interface ScopedSearchResult {
  scope: CategorySlug;
  type: ContentType;
  videos: VideoCandidate[];
}

export interface TranscriptResult {
  source: TranscriptSource;
  language?: string;
  content: string;
}

export interface SummaryResult {
  keyPoints: string[];
  notableQuotes: { quote: string; speaker?: string }[];
  topics: string[];
  summaryText: string;
}
