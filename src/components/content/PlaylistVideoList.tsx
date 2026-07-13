"use client";

import { useState } from "react";
import { Pause, Play, X } from "lucide-react";
import type { ApiVideo } from "@/types/api";
import { Badge } from "@/components/ui/Badge";
import { SummaryPanel } from "@/components/content/SummaryPanel";
import { BookmarkButton } from "@/components/content/BookmarkButton";
import { usePlayer } from "@/context/PlayerContext";
import { toNowPlayingTrack } from "@/lib/toNowPlayingTrack";
import { useLocale } from "@/context/LocaleContext";

export function PlaylistVideoList({
  playlistId,
  initialVideos,
  savedVideoIds,
}: {
  playlistId: string;
  initialVideos: ApiVideo[];
  savedVideoIds: Set<string>;
}) {
  const [videos, setVideos] = useState(initialVideos);
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

  async function removeFromPlaylist(videoId: string) {
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    await fetch(`/api/playlists/${playlistId}/videos/${videoId}`, { method: "DELETE" });
  }

  if (videos.length === 0) {
    return <p className="text-muted">{t("video.noVideosInPlaylist")}</p>;
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
            <BookmarkButton videoId={video.id} initialSaved={savedVideoIds.has(video.id)} />
            <button
              onClick={() => removeFromPlaylist(video.id)}
              title={t("video.removeFromPlaylist")}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
            >
              <X size={15} />
            </button>
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
