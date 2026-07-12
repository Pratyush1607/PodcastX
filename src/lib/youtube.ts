import { google } from "googleapis";
import type { CategorySlug, ContentType } from "@/types/db";
import type { VideoCandidate } from "@/agents/types";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

/** Search query terms per category, tuned separately for podcasts vs interviews. 'overall' uses a single broad term. */
export const QUERY_TERMS: Record<ContentType, Record<CategorySlug, string>> = {
  podcast: {
    overall: "podcast",
    tech_ai: "tech podcast",
    science_education: "science podcast",
    sports: "sports podcast",
    health_fitness: "health podcast",
    comedy: "comedy podcast",
    pop_internet_culture: "pop culture podcast",
  },
  interview: {
    overall: "interview",
    tech_ai: "tech interview",
    science_education: "science interview",
    sports: "sports interview",
    health_fitness: "health and fitness interview",
    comedy: "comedy interview",
    pop_internet_culture: "celebrity interview",
  },
};

function sevenDaysAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

/** Searches YouTube for `query`, published in the last 7 days, and returns candidates sorted by view count desc. */
export async function searchTopVideos(query: string, overfetch = 25): Promise<VideoCandidate[]> {
  const searchRes = await youtube.search.list({
    part: ["id"],
    q: query,
    type: ["video"],
    order: "viewCount",
    publishedAfter: sevenDaysAgoIso(),
    maxResults: overfetch,
  });

  const videoIds = (searchRes.data.items ?? [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => Boolean(id));
  if (videoIds.length === 0) return [];

  const detailsRes = await youtube.videos.list({
    part: ["snippet", "statistics"],
    id: videoIds,
  });

  const candidates: VideoCandidate[] = (detailsRes.data.items ?? []).map((item) => ({
    youtubeVideoId: item.id!,
    title: item.snippet?.title ?? "Untitled",
    channelName: item.snippet?.channelTitle ?? "Unknown channel",
    url: `https://www.youtube.com/watch?v=${item.id}`,
    viewCount: Number(item.statistics?.viewCount ?? 0),
    publishedAt: item.snippet?.publishedAt ?? new Date().toISOString(),
    thumbnailUrl:
      item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.default?.url ?? undefined,
  }));

  return candidates.sort((a, b) => b.viewCount - a.viewCount);
}

export async function searchTopFive(type: ContentType, scope: CategorySlug): Promise<VideoCandidate[]> {
  const query = QUERY_TERMS[type][scope];
  const results = await searchTopVideos(query);
  return results.slice(0, 5);
}
