"use client";

import { useState } from "react";
import Link from "next/link";
import type { ApiVideo } from "@/types/api";
import { Badge } from "@/components/ui/Badge";
import { SummaryPanel } from "@/components/content/SummaryPanel";
import { BookmarkButton } from "@/components/content/BookmarkButton";
import { AddToPlaylistButton } from "@/components/content/AddToPlaylistButton";

export function Row({
  label,
  videos,
  seeAllHref,
  savedVideoIds,
}: {
  label: string;
  videos: ApiVideo[];
  seeAllHref: string;
  savedVideoIds: Set<string>;
}) {
  const [selected, setSelected] = useState<ApiVideo | null>(null);

  if (videos.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold">{label}</h3>
        <Link href={seeAllHref} className="text-xs font-semibold text-accent hover:brightness-110">
          View All
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {videos.map((video) => (
          <div key={video.id} className="group">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelected(video)}
              onKeyDown={(e) => e.key === "Enter" && setSelected(video)}
              className="relative aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-2xl bg-surface"
            >
              {video.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.thumbnail_url}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              )}

              {!video.summary && (
                <div className="absolute top-3 left-3">
                  <Badge variant="warning">Processing</Badge>
                </div>
              )}

              <div className="absolute top-3 right-3 flex gap-1.5">
                <AddToPlaylistButton videoId={video.id} />
                <BookmarkButton videoId={video.id} initialSaved={savedVideoIds.has(video.id)} />
              </div>
            </div>

            <button onClick={() => setSelected(video)} className="mt-2 block w-full text-left">
              <p className="line-clamp-1 text-sm font-bold">{video.title}</p>
              <p className="truncate text-xs text-muted">{video.channel_name}</p>
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <SummaryPanel
          video={selected}
          isSaved={savedVideoIds.has(selected.id)}
          onClose={() => setSelected(null)}
          queue={videos}
        />
      )}
    </div>
  );
}
