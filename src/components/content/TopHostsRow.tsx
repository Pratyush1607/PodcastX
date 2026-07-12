"use client";

import { useMemo, useState } from "react";
import type { ApiVideo } from "@/types/api";
import { SummaryPanel } from "@/components/content/SummaryPanel";

export function TopHostsRow({ videos, savedVideoIds }: { videos: ApiVideo[]; savedVideoIds: Set<string> }) {
  const [selected, setSelected] = useState<ApiVideo | null>(null);

  const hosts = useMemo(() => {
    const seen = new Set<string>();
    const result: ApiVideo[] = [];
    for (const video of videos) {
      if (seen.has(video.channel_name)) continue;
      seen.add(video.channel_name);
      result.push(video);
      if (result.length === 6) break;
    }
    return result;
  }, [videos]);

  if (hosts.length === 0) return null;

  return (
    <div>
      <h3 className="mb-4 text-xl font-bold">Top hosts</h3>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {hosts.map((video) => (
          <button
            key={video.id}
            onClick={() => setSelected(video)}
            className="group flex flex-col items-center gap-2 text-center"
          >
            <div className="h-20 w-20 overflow-hidden rounded-full bg-surface transition group-hover:ring-2 group-hover:ring-accent">
              {video.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.thumbnail_url}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                />
              )}
            </div>
            <p className="w-full truncate text-xs font-semibold text-muted group-hover:text-foreground">
              {video.channel_name}
            </p>
          </button>
        ))}
      </div>

      {selected && (
        <SummaryPanel
          video={selected}
          isSaved={savedVideoIds.has(selected.id)}
          onClose={() => setSelected(null)}
          queue={hosts}
        />
      )}
    </div>
  );
}
