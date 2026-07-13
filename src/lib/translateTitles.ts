import { after } from "next/server";
import { getCachedTitles, saveTitleTranslation } from "@/lib/supabase/queries";
import { translateTitlesBulk } from "@/lib/gemini";
import { LOCALE_ENGLISH_NAMES, type Locale } from "@/lib/locales";

/**
 * Returns `videos` with `.title` replaced by its cached title in `locale`, falling back to the
 * original title for anything not cached yet. Runs for every locale including English — plenty
 * of scraped content isn't originally in English (Indonesian, Spanish, Hindi, ...), so English
 * preference still means "translate into English", not "skip translation".
 *
 * Missing titles are NOT translated inline here — Gemini's own client-side rate limiter can
 * block for tens of seconds when the process has been busy, which previously caused page loads
 * to time out on Vercel. Instead this schedules a background translation (via `after()`) that
 * warms the cache for the *next* view of these videos, batched into one Gemini call per distinct
 * missing set rather than one per video.
 */
export async function withTranslatedTitles<T extends { id: string; title: string }>(
  videos: T[],
  locale: Locale
): Promise<T[]> {
  if (videos.length === 0) return videos;

  const uniqueVideos = Array.from(new Map(videos.map((v) => [v.id, v])).values());
  const cached = await getCachedTitles(
    uniqueVideos.map((v) => v.id),
    locale
  );

  const missing = uniqueVideos.filter((v) => !cached.has(v.id));
  if (missing.length > 0) {
    after(async () => {
      try {
        const translated = await translateTitlesBulk(
          missing.map((v) => ({ id: v.id, title: v.title })),
          LOCALE_ENGLISH_NAMES[locale]
        );
        await Promise.all(translated.map((t) => saveTitleTranslation(t.id, locale, t.title)));
      } catch {
        // Best-effort — if Gemini is unavailable or rate-limited, these titles just stay
        // untranslated until a later visit successfully warms the cache.
      }
    });
  }

  return videos.map((v) => (cached.has(v.id) ? { ...v, title: cached.get(v.id)! } : v));
}
