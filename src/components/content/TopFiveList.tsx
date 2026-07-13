"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import type { ApiVideo } from "@/types/api";
import { Badge } from "@/components/ui/Badge";
import { SummaryPanel } from "@/components/content/SummaryPanel";
import { BookmarkButton } from "@/components/content/BookmarkButton";
import { AddToPlaylistButton } from "@/components/content/AddToPlaylistButton";
import { usePlayer } from "@/context/PlayerContext";
import { toNowPlayingTrack } from "@/lib/toNowPlayingTrack";
import { useLocale } from "@/context/LocaleContext";

export function TopFiveList({ videos, savedVideoIds }: { videos: ApiVideo[]; savedVideoIds: Set<string> }) {
  const [selected, setSelected] = useState<ApiVideo | null>(null);
  const { current, playing, play, togglePlay } = usePlayer();
  const { t } = useLocale();

  function handlePlayClick(e: React.MouseEvent, video: ApiVideo) {
    e.stopPropagation();
    if (current?.id === video.id) {
      togglePlay();
      return;
    }
    play(toNowPlayingTrack(video), videos.map(toNowPlayingTrack));
  }

  if (videos.length === 0) {
    return <p className="text-muted">{t("video.noVideosFound")}</p>;
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
            <div className="group/thumb relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-background">
              {video.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover" />
              )}
              <button
                onClick={(e) => handlePlayClick(e, video)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 backdrop-blur-sm transition group-hover/thumb:opacity-100 hover:bg-accent hover:text-accent-ink"
              >
                {current?.id === video.id && playing ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} className="ml-0.5" />
                )}
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{video.title}</p>
              <p className="truncate text-sm text-muted">{video.channel_name}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm text-muted">
                {Number(video.view_count ?? 0).toLocaleString()} {t("video.views")}
              </span>
              {!video.summary && <Badge variant="warning">{t("video.processing")}</Badge>}
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
