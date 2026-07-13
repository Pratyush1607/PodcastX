"use client";

import { useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { ApiVideo } from "@/types/api";
import { SummaryPanel } from "@/components/content/SummaryPanel";
import { usePlayer } from "@/context/PlayerContext";
import { toNowPlayingTrack } from "@/lib/toNowPlayingTrack";
import { useLocale } from "@/context/LocaleContext";

export function TopHostsRow({ videos, savedVideoIds }: { videos: ApiVideo[]; savedVideoIds: Set<string> }) {
  const [selected, setSelected] = useState<ApiVideo | null>(null);
  const { current, playing, play, togglePlay } = usePlayer();
  const { t } = useLocale();

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

  function handlePlayClick(e: React.MouseEvent, video: ApiVideo) {
    e.stopPropagation();
    if (current?.id === video.id) {
      togglePlay();
      return;
    }
    play(toNowPlayingTrack(video), hosts.map(toNowPlayingTrack));
  }

  return (
    <div>
      <h3 className="mb-4 text-xl font-bold">{t("home.topHosts")}</h3>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {hosts.map((video) => (
          <div
            key={video.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelected(video)}
            onKeyDown={(e) => e.key === "Enter" && setSelected(video)}
            className="group flex cursor-pointer flex-col items-center gap-2 text-center"
          >
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-surface transition group-hover:ring-2 group-hover:ring-accent">
              {video.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.thumbnail_url}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                />
              )}
              <button
                onClick={(e) => handlePlayClick(e, video)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-accent hover:text-accent-ink"
              >
                {current?.id === video.id && playing ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} className="ml-0.5" />
                )}
              </button>
            </div>
            <p className="w-full truncate text-xs font-semibold text-muted group-hover:text-foreground">
              {video.channel_name}
            </p>
          </div>
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
