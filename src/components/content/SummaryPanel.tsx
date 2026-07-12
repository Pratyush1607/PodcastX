import { Pause, Play, X } from "lucide-react";
import type { ApiVideo } from "@/types/api";
import { Badge } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/content/BookmarkButton";
import { AddToPlaylistButton } from "@/components/content/AddToPlaylistButton";
import { usePlayer } from "@/context/PlayerContext";

export function SummaryPanel({
  video,
  isSaved,
  onClose,
  queue,
}: {
  video: ApiVideo;
  isSaved: boolean;
  onClose: () => void;
  queue?: ApiVideo[];
}) {
  const summary = video.summary;
  const { current, playing, play, togglePlay } = usePlayer();
  const isCurrent = current?.id === video.id;

  function handlePlayClick() {
    if (isCurrent) {
      togglePlay();
      return;
    }
    const toTrack = (v: ApiVideo) => ({
      id: v.id,
      youtubeVideoId: v.youtube_video_id,
      title: v.title,
      channelName: v.channel_name,
      thumbnailUrl: v.thumbnail_url,
    });
    play(
      toTrack(video),
      (queue ?? [video]).map(toTrack)
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero image header, Podio detail-screen style */}
        <div className="relative h-52 w-full overflow-hidden rounded-t-[28px]">
          {video.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.thumbnail_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-black/20" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
          >
            <X size={18} />
          </button>
        </div>

        <div className="-mt-8 space-y-5 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold">{video.title}</h2>
              <p className="mt-1 text-sm font-semibold text-accent">{video.channel_name}</p>
              <p className="mt-1 text-xs text-muted">
                {Number(video.view_count ?? 0).toLocaleString()} views
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <AddToPlaylistButton videoId={video.id} size="lg" />
              <BookmarkButton videoId={video.id} initialSaved={isSaved} size="lg" />
            </div>
          </div>

          <button
            onClick={handlePlayClick}
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink transition hover:brightness-105"
          >
            {isCurrent && playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            {isCurrent ? (playing ? "Playing" : "Paused") : "Play episode"}
          </button>

          {!summary && (
            <p className="text-muted">
              Summary not ready yet — check back after this video finishes processing.
            </p>
          )}

          {summary && (
            <div className="space-y-5">
              <p className="leading-relaxed text-foreground/90">{summary.summary_text}</p>

              <div>
                <h3 className="mb-2 text-xs font-bold tracking-[0.15em] text-muted uppercase">Key points</h3>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {summary.key_points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>

              {summary.notable_quotes?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-bold tracking-[0.15em] text-muted uppercase">
                    Notable quotes
                  </h3>
                  <div className="space-y-2">
                    {summary.notable_quotes.map((q, i) => (
                      <blockquote key={i} className="border-l-2 border-accent pl-3 text-sm italic">
                        &ldquo;{q.quote}&rdquo;
                        {q.speaker && <span className="not-italic text-muted"> — {q.speaker}</span>}
                      </blockquote>
                    ))}
                  </div>
                </div>
              )}

              {summary.topics?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {summary.topics.map((topic, i) => (
                    <Badge key={i}>{topic}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-accent-ink transition hover:brightness-105"
          >
            Watch on YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
