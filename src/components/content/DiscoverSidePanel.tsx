"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Settings,
  Cpu,
  GraduationCap,
  Trophy,
  HeartPulse,
  Smile,
  Globe,
} from "lucide-react";
import type { ApiVideo } from "@/types/api";
import type { CategorySlug } from "@/types/db";
import { SummaryPanel } from "@/components/content/SummaryPanel";
import { NotificationBell } from "@/components/content/NotificationBell";

const CATEGORY_ICONS: Record<Exclude<CategorySlug, "overall">, typeof Cpu> = {
  tech_ai: Cpu,
  science_education: GraduationCap,
  sports: Trophy,
  health_fitness: HeartPulse,
  comedy: Smile,
  pop_internet_culture: Globe,
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function DiscoverSidePanel({
  userEmail,
  userName,
  searchableVideos,
  genres,
  recentSaves,
  savedVideoIds,
}: {
  userEmail: string | null;
  userName: string | null;
  searchableVideos: ApiVideo[];
  genres: { scope: CategorySlug; label: string; totalViews: number }[];
  recentSaves: { video: ApiVideo; savedAt: string }[];
  savedVideoIds: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ApiVideo | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<ApiVideo[]>([]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchableVideos
      .filter((v) => v.title.toLowerCase().includes(q) || v.channel_name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query, searchableVideos]);

  return (
    <div className="space-y-6 px-8 pb-6 lg:fixed lg:inset-y-0 lg:right-0 lg:z-30 lg:w-80 lg:overflow-y-auto lg:border-l lg:border-border lg:bg-sidebar lg:px-6 lg:pt-8 lg:pb-28">
      {userEmail && (
        <div className="flex items-center justify-end gap-2">
          <Link
            href="/profile"
            title="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-foreground"
          >
            <Settings size={17} />
          </Link>
          <NotificationBell recentSaves={recentSaves.map((r) => r.video)} />
          <Link
            href="/profile"
            title={userEmail}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink"
          >
            {(userName ?? userEmail)[0]!.toUpperCase()}
          </Link>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search here"
          className="w-full rounded-full border border-border bg-surface py-2.5 pr-11 pl-11 text-sm outline-none focus:border-accent"
        />
        <SlidersHorizontal size={16} className="absolute top-1/2 right-4 -translate-y-1/2 text-muted" />

        {results.length > 0 && (
          <div className="absolute top-12 right-0 left-0 z-20 space-y-1 rounded-2xl bg-surface p-2 shadow-xl">
            {results.map((video) => (
              <button
                key={video.id}
                onClick={() => {
                  setSelected(video);
                  setSelectedQueue(results);
                  setQuery("");
                }}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-surface-hover"
              >
                {video.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{video.title}</p>
                  <p className="truncate text-xs text-muted">{video.channel_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-[0.15em] text-muted uppercase">Recently saved</h3>
          <Link href="/favourites" className="text-xs font-semibold text-accent hover:brightness-110">
            View all
          </Link>
        </div>
        {recentSaves.length === 0 ? (
          <p className="text-sm text-muted">Nothing saved yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {recentSaves.map(({ video, savedAt }) => (
              <button
                key={video.id}
                onClick={() => {
                  setSelected(video);
                  setSelectedQueue(recentSaves.map((r) => r.video));
                }}
                className="flex items-center gap-3 rounded-xl p-2 text-left transition hover:bg-surface-hover"
              >
                {video.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{video.title}</p>
                  <p className="truncate text-xs text-muted">{video.channel_name}</p>
                </div>
                <span className="shrink-0 text-[11px] whitespace-nowrap text-muted">
                  {formatRelativeTime(savedAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold tracking-[0.15em] text-muted uppercase">Categories</h3>
        <div className="relative">
          <div className="grid grid-cols-3 gap-3 pointer-events-none blur-sm select-none">
            {genres.map((genre) => {
              const Icon = CATEGORY_ICONS[genre.scope as Exclude<CategorySlug, "overall">];
              return (
                <div
                  key={genre.scope}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted">
                    {Icon && <Icon size={16} />}
                  </span>
                  <span className="w-full truncate text-center text-[11px] font-semibold text-muted">
                    {genre.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-surface px-4 py-1.5 text-xs font-bold text-foreground shadow-xl">
              Coming soon
            </span>
          </div>
        </div>
      </div>

      {selected && (
        <SummaryPanel
          video={selected}
          isSaved={savedVideoIds.has(selected.id)}
          onClose={() => setSelected(null)}
          queue={selectedQueue}
        />
      )}
    </div>
  );
}
