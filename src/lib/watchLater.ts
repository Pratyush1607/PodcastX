import { createClient } from "@/lib/supabase/server";
import { getVideosByIds, type ScopeVideo } from "@/lib/supabase/queries";

/** IDs of videos the current signed-in user has saved. RLS scopes this automatically; empty set if signed out. */
export async function getSavedVideoIdSet(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("watch_later").select("video_id");
  return new Set((data ?? []).map((row) => row.video_id));
}

/** The current signed-in user's most recently saved videos, newest first. Empty if signed out. */
export async function getRecentSavedVideos(limit = 5): Promise<ScopeVideo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("watch_later")
    .select("video_id")
    .order("created_at", { ascending: false })
    .limit(limit);
  return getVideosByIds((data ?? []).map((row) => row.video_id));
}

/** Same as getRecentSavedVideos, but paired with when each was saved (for "X min ago" display). */
export async function getRecentSavedVideosWithTimestamps(
  limit = 5
): Promise<{ video: ScopeVideo; savedAt: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("watch_later")
    .select("video_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  const videos = await getVideosByIds(rows.map((row) => row.video_id));
  const videoById = new Map(videos.map((v) => [v.id, v]));
  return rows
    .map((row) => ({ video: videoById.get(row.video_id), savedAt: row.created_at as string }))
    .filter((row): row is { video: ScopeVideo; savedAt: string } => Boolean(row.video));
}
