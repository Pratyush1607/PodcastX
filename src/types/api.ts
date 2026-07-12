import type { CategorySlug, SummaryRow, TranscriptRow, VideoRow } from "@/types/db";

/** Client-safe shape returned by /api/content/* routes (mirrors ScopeVideo from lib/supabase/queries). */
export interface ApiVideo extends VideoRow {
  rank: number;
  transcript: TranscriptRow | null;
  summary: SummaryRow | null;
}

export interface HomepagePayload {
  runId: string | null;
  all: ApiVideo[];
  categories: { scope: CategorySlug; label: string; videos: ApiVideo[] }[];
  genres: { scope: CategorySlug; label: string; totalViews: number }[];
}

export interface ScopePagePayload {
  runId: string | null;
  scope: CategorySlug;
  label: string;
  videos: ApiVideo[];
}
