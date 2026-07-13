import { useEffect, useState } from "react";
import { Languages, Pause, Play, X } from "lucide-react";
import type { ApiVideo } from "@/types/api";
import { Badge } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/content/BookmarkButton";
import { AddToPlaylistButton } from "@/components/content/AddToPlaylistButton";
import { usePlayer } from "@/context/PlayerContext";
import { useLocale } from "@/context/LocaleContext";

interface Translation {
  translated_title: string;
  translated_summary_text: string | null;
  translated_key_points: string[] | null;
  translated_notable_quotes: { quote: string; speaker?: string }[] | null;
  translated_topics: string[] | null;
}

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
  const { t, locale } = useLocale();
  const isCurrent = current?.id === video.id;

  const [translation, setTranslation] = useState<Translation | null>(null);
  const [originalTitle, setOriginalTitle] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showOriginalTitle, setShowOriginalTitle] = useState(false);
  const [showOriginalKeyPoints, setShowOriginalKeyPoints] = useState(false);
  const [originalQuoteIndexes, setOriginalQuoteIndexes] = useState<Set<number>>(new Set());

  const contentKey = `${video.id}:${locale}`;
  const [prevContentKey, setPrevContentKey] = useState(contentKey);
  if (contentKey !== prevContentKey) {
    setPrevContentKey(contentKey);
    setTranslation(null);
    setOriginalTitle(null);
    setShowOriginalTitle(false);
    setShowOriginalKeyPoints(false);
    setOriginalQuoteIndexes(new Set());
    setTranslating(true);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/translate/${video.id}?locale=${locale}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.translation) setTranslation(data.translation);
        // video.title may already be list-translated by the time it reaches this panel, so the
        // true original (as stored in the DB, untouched) comes from the API response instead.
        if (data?.originalTitle) setOriginalTitle(data.originalTitle);
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [video.id, locale]);

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

  function toggleQuoteOriginal(i: number) {
    setOriginalQuoteIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  const displayTitle =
    translation && !showOriginalTitle ? translation.translated_title : (originalTitle ?? video.title);
  const displaySummaryText = translation?.translated_summary_text ?? summary?.summary_text ?? null;
  const displayKeyPoints =
    translation?.translated_key_points && !showOriginalKeyPoints
      ? translation.translated_key_points
      : (summary?.key_points ?? []);
  const displayTopics = translation?.translated_topics ?? summary?.topics ?? [];
  const displayQuotes = summary?.notable_quotes ?? [];
  const translatedQuotes = translation?.translated_notable_quotes ?? null;

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
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold">{displayTitle}</h2>
                {(translation || translating) && (
                  <button
                    onClick={() => setShowOriginalTitle((s) => !s)}
                    disabled={translating}
                    title={showOriginalTitle ? t("summary.showTranslated") : t("summary.showOriginal")}
                    className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-white/10 hover:text-accent disabled:opacity-50"
                  >
                    <Languages size={16} />
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm font-semibold text-accent">{video.channel_name}</p>
              <p className="mt-1 text-xs text-muted">
                {Number(video.view_count ?? 0).toLocaleString()} {t("video.views")}
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
            {isCurrent ? (playing ? t("summary.playing") : t("summary.paused")) : t("summary.playEpisode")}
          </button>

          {!summary && <p className="text-muted">{t("summary.summaryNotReady")}</p>}

          {summary && (
            <div className="space-y-5">
              {displaySummaryText && <p className="leading-relaxed text-foreground/90">{displaySummaryText}</p>}

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-xs font-bold tracking-[0.15em] text-muted uppercase">
                    {t("summary.keyPoints")}
                  </h3>
                  {translation?.translated_key_points && (
                    <button
                      onClick={() => setShowOriginalKeyPoints((s) => !s)}
                      title={showOriginalKeyPoints ? t("summary.showTranslated") : t("summary.showOriginal")}
                      className="shrink-0 rounded-full p-1 text-muted transition hover:bg-white/10 hover:text-accent"
                    >
                      <Languages size={13} />
                    </button>
                  )}
                </div>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {displayKeyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>

              {displayQuotes.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-bold tracking-[0.15em] text-muted uppercase">
                    {t("summary.notableQuotes")}
                  </h3>
                  <div className="space-y-2">
                    {displayQuotes.map((q, i) => {
                      const translatedQuote = translatedQuotes?.[i];
                      const showOriginal = !translatedQuote || originalQuoteIndexes.has(i);
                      const shown = showOriginal ? q : translatedQuote;
                      return (
                        <blockquote
                          key={i}
                          className="flex items-start gap-2 border-l-2 border-accent pl-3 text-sm italic"
                        >
                          <span className="flex-1">
                            &ldquo;{shown.quote}&rdquo;
                            {shown.speaker && <span className="not-italic text-muted"> — {shown.speaker}</span>}
                          </span>
                          {translatedQuote && (
                            <button
                              onClick={() => toggleQuoteOriginal(i)}
                              title={showOriginal ? t("summary.showTranslated") : t("summary.showOriginal")}
                              className="mt-0.5 shrink-0 rounded-full p-1 text-muted transition hover:bg-white/10 hover:text-accent"
                            >
                              <Languages size={13} />
                            </button>
                          )}
                        </blockquote>
                      );
                    })}
                  </div>
                </div>
              )}

              {displayTopics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {displayTopics.map((topic, i) => (
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
            {t("summary.watchOnYouTube")}
          </a>
        </div>
      </div>
    </div>
  );
}
