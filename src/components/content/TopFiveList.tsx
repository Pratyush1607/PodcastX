"use client";

import { useState } from "react";
import type { ApiVideo } from "@/types/api";
import { Badge } from "@/components/ui/Badge";
import { SummaryPanel } from "@/components/content/SummaryPanel";
import { BookmarkButton } from "@/components/content/BookmarkButton";
import { AddToPlaylistButton } from "@/components/content/AddToPlaylistButton";

export function TopFiveList({ videos, savedVideoIds }: { videos: ApiVideo[]; savedVideoIds: Set<string> }) {
  const [selected, setSelected] = useState<ApiVideo | null>(null);

  if (videos.length === 0) {
    return <p className="text-muted">No videos found for this scope yet — run the pipeline first.</p>;
  }

  return (
    <div className="space-y-2">
      {videos.map((video) => (
        <div
          key={video.id}
          className="flex items-center gap-4 rounded-2xl bg-surface p-3 transition hover:bg-surface-hover"
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSelected(video)}
            onKeyDown={(e) => e.key === "Enter" && setSelected(video)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 text-left"
          >
            <span className="w-6 text-center text-lg font-bold text-accent">{video.rank}</span>
            {video.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={video.thumbnail_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{video.title}</p>
              <p className="truncate text-sm text-muted">{video.channel_name}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm text-muted">{Number(video.view_count ?? 0).toLocaleString()} views</span>
              {!video.summary && <Badge variant="warning">Processing</Badge>}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <AddToPlaylistButton videoId={video.id} />
            <BookmarkButton videoId={video.id} initialSaved={savedVideoIds.has(video.id)} />
          </div>
        </div>
      ))}

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
