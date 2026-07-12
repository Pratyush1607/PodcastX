import Link from "next/link";
import { Plus } from "lucide-react";
import type { ContentType } from "@/types/db";
import { getHomepageData } from "@/lib/content";
import { getSavedVideoIdSet, getRecentSavedVideosWithTimestamps } from "@/lib/watchLater";
import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/content/Hero";
import { DiscoverSidePanel } from "@/components/content/DiscoverSidePanel";
import { TopHostsRow } from "@/components/content/TopHostsRow";
import { Row } from "@/components/content/Row";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export async function DiscoverHome({ type }: { type: ContentType }) {
  const supabase = await createClient();
  const [{ runId, all, categories, genres }, savedVideoIds, recentSaves, { data: { user } }] =
    await Promise.all([
      getHomepageData(type),
      getSavedVideoIdSet(),
      getRecentSavedVideosWithTimestamps(),
      supabase.auth.getUser(),
    ]);
  const base = type === "podcast" ? "/podcasts" : "/interviews";
  const kind = type === "podcast" ? "podcasts" : "interviews";
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
                <p className="text-sm text-muted">{greeting()}</p>
                <p className="font-bold capitalize">{name}</p>
              </div>
            </div>
            <Link
              href="/playlists"
              className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:brightness-110"
            >
              <Plus size={16} />
              Make a playlist
            </Link>
          </div>
        )}

        {!runId ? (
          <p className="py-12 text-muted">
            This week&apos;s top {kind} haven&apos;t been researched yet — check back soon.
          </p>
        ) : (
          <div className="space-y-8">
            <div>
              <p className="mb-3 text-sm text-muted">Trending</p>
              <Hero videos={all.slice(0, 5)} savedVideoIds={savedVideoIds} />
            </div>

            <TopHostsRow videos={all} savedVideoIds={savedVideoIds} />

            <Row
              label={`Trending ${kind}`}
              videos={all}
              seeAllHref={`${base}/overall`}
              savedVideoIds={savedVideoIds}
            />

            {categories.map((cat) => (
              <Row
                key={cat.scope}
                label={cat.label}
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
          searchableVideos={[...all, ...categories.flatMap((c) => c.videos)]}
          genres={genres}
          recentSaves={recentSaves}
          savedVideoIds={savedVideoIds}
        />
      )}
    </>
  );
}
