"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ApiVideo } from "@/types/api";
import { SummaryPanel } from "@/components/content/SummaryPanel";
import { BookmarkButton } from "@/components/content/BookmarkButton";
import { AddToPlaylistButton } from "@/components/content/AddToPlaylistButton";

export function Hero({ videos, savedVideoIds }: { videos: ApiVideo[]; savedVideoIds: Set<string> }) {
  const [index, setIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  if (videos.length === 0) return <div className="h-48 rounded-[28px] bg-surface sm:h-56" />;

  const video = videos[index]!;

  function go(delta: number) {
    setIndex((i) => (i + delta + videos.length) % videos.length);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setShowSummary(true)}
      onKeyDown={(e) => e.key === "Enter" && setShowSummary(true)}
      className="group relative h-48 w-full cursor-pointer overflow-hidden rounded-[28px] bg-surface sm:h-56"
    >
      {video.thumbnail_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.thumbnail_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

      <div className="absolute top-4 left-4">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-accent-ink">
          #{index + 1} Trending
        </span>
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        <AddToPlaylistButton videoId={video.id} />
        <BookmarkButton videoId={video.id} initialSaved={savedVideoIds.has(video.id)} />
      </div>

      {videos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute top-1/2 left-4 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute top-1/2 right-4 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      <div className="relative flex h-full max-w-md flex-col justify-end gap-1 p-6 sm:p-8">
        <h2 className="text-xl leading-[1.15] font-extrabold text-accent sm:text-2xl">{video.title}</h2>
        <p className="line-clamp-2 text-sm text-white/70">{video.channel_name}</p>
      </div>

      {showSummary && (
        <SummaryPanel
          video={video}
          isSaved={savedVideoIds.has(video.id)}
          onClose={() => setShowSummary(false)}
          queue={videos}
        />
      )}
    </div>
  );
}
