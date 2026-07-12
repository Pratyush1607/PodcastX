import { CATEGORY_LABELS, CATEGORY_SLUGS } from "@/types/db";
import type { CategorySlug, ContentType } from "@/types/db";
import type { HomepagePayload, ScopePagePayload } from "@/types/api";
import { getCategoryViewTotals, getLatestRunId, getScopeVideos } from "@/lib/supabase/queries";

export async function getHomepageData(type: ContentType): Promise<HomepagePayload> {
  const runId = await getLatestRunId();
  if (!runId) return { runId: null, all: [], categories: [], genres: [] };

  const [all, totals] = await Promise.all([
    getScopeVideos(runId, type, "overall"),
    getCategoryViewTotals(runId, type),
  ]);

  const totalsByScope = new Map(totals.map((t) => [t.scope, t.totalViews]));
  const genres = CATEGORY_SLUGS.map((scope) => ({
    scope,
    label: CATEGORY_LABELS[scope],
    totalViews: totalsByScope.get(scope) ?? 0,
  })).sort((a, b) => b.totalViews - a.totalViews);

  const topFourScopes = genres.filter((g) => g.totalViews > 0).slice(0, 4).map((g) => g.scope);

  const categories = await Promise.all(
    topFourScopes.map(async (scope) => ({
      scope,
      label: CATEGORY_LABELS[scope],
      videos: await getScopeVideos(runId, type, scope),
    }))
  );

  return { runId, all, categories, genres };
}

export async function getScopePageData(type: ContentType, scope: CategorySlug): Promise<ScopePagePayload> {
  const runId = await getLatestRunId();
  if (!runId) return { runId: null, scope, label: CATEGORY_LABELS[scope], videos: [] };

  const videos = await getScopeVideos(runId, type, scope);
  return { runId, scope, label: CATEGORY_LABELS[scope], videos };
}
