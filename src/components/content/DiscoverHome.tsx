import Link from "next/link";
import { Plus } from "lucide-react";
import type { ContentType } from "@/types/db";
import type { ApiVideo } from "@/types/api";
import { getHomepageData } from "@/lib/content";
import { getSavedVideoIdSet, getRecentSavedVideosWithTimestamps } from "@/lib/watchLater";
import { createClient } from "@/lib/supabase/server";
import { withTranslatedTitles } from "@/lib/translateTitles";
import { Hero } from "@/components/content/Hero";
import { DiscoverSidePanel } from "@/components/content/DiscoverSidePanel";
import { TopHostsRow } from "@/components/content/TopHostsRow";
import { Row } from "@/components/content/Row";
import { CATEGORY_LABEL_KEYS } from "@/lib/categoryLabels";
import { getServerT } from "@/lib/serverTranslate";

function greetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "home.goodMorning";
  if (hour < 18) return "home.goodAfternoon";
  return "home.goodEvening";
}

export async function DiscoverHome({ type }: { type: ContentType }) {
  const supabase = await createClient();
  const [{ runId, all, categories, genres }, savedVideoIds, recentSaves, { data: { user } }, { t, locale }] =
    await Promise.all([
      getHomepageData(type),
      getSavedVideoIdSet(),
      getRecentSavedVideosWithTimestamps(),
      supabase.auth.getUser(),
      getServerT(),
    ]);

  // Translate every distinct video's title once, then reuse the result across all/categories/recentSaves
  // instead of translating the same video multiple times.
  const videoById = new Map<string, ApiVideo>();
  for (const v of all) videoById.set(v.id, v);
  for (const cat of categories) for (const v of cat.videos) videoById.set(v.id, v);
  for (const r of recentSaves) videoById.set(r.video.id, r.video);
  const translatedById = new Map(
    (await withTranslatedTitles(Array.from(videoById.values()), locale)).map((v) => [v.id, v.title])
  );
  const withTitle = <T extends { id: string; title: string }>(v: T): T => ({
    ...v,
    title: translatedById.get(v.id) ?? v.title,
  });

  const translatedAll = all.map(withTitle);
  const translatedCategories = categories.map((cat) => ({ ...cat, videos: cat.videos.map(withTitle) }));
  const translatedRecentSaves = recentSaves.map((r) => ({ ...r, video: withTitle(r.video) }));

  const base = type === "podcast" ? "/podcasts" : "/interviews";
  const kind = type === "podcast" ? t("sidebar.podcasts") : t("sidebar.interviews");
  const kindKey = type === "podcast" ? "trendingPodcasts" : "trendingInterviews";
  const name = user?.email?.split("@")[0];

  return (
    <>
      <div className="space-y-8 px-8 py-6 lg:pr-[336px]">
        {name && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-sm font-bold text-accent">
                {name[0]!.toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-muted">{t(greetingKey())}</p>
                <p className="font-bold capitalize">{name}</p>
              </div>
            </div>
            <Link
              href="/playlists"
              className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:brightness-110"
            >
              <Plus size={16} />
              {t("home.makeAPlaylist")}
            </Link>
          </div>
        )}

        {!runId ? (
          <p className="py-12 text-muted">{t("home.noContentYet", { kind })}</p>
        ) : (
          <div className="space-y-8">
            <div>
              <p className="mb-3 text-sm text-muted">{t("home.trending")}</p>
              <Hero videos={translatedAll.slice(0, 5)} savedVideoIds={savedVideoIds} />
            </div>

            <TopHostsRow videos={translatedAll} savedVideoIds={savedVideoIds} />

            <Row
              label={t(`home.${kindKey}`)}
              videos={translatedAll}
              seeAllHref={`${base}/overall`}
              savedVideoIds={savedVideoIds}
            />

            {translatedCategories.map((cat) => (
              <Row
                key={cat.scope}
                label={t(CATEGORY_LABEL_KEYS[cat.scope])}
                videos={cat.videos}
                seeAllHref={`${base}/${cat.scope}`}
                savedVideoIds={savedVideoIds}
              />
            ))}
          </div>
        )}
      </div>

      {runId && (
        <DiscoverSidePanel
          userEmail={user?.email ?? null}
          userName={name ?? null}
          searchableVideos={[...translatedAll, ...translatedCategories.flatMap((c) => c.videos)]}
          genres={genres}
          recentSaves={translatedRecentSaves}
          savedVideoIds={savedVideoIds}
        />
      )}
    </>
  );
}
