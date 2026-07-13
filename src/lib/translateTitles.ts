import { getCachedTitles, saveTitleTranslation } from "@/lib/supabase/queries";
import { translateTitlesBulk } from "@/lib/gemini";
import { LOCALE_ENGLISH_NAMES, type Locale } from "@/lib/locales";

/**
 * Returns `videos` with `.title` replaced by its cached (or freshly translated, then cached)
 * title in `locale`. Runs for every locale including English — plenty of scraped content isn't
 * originally in English (Indonesian, Spanish, Hindi, ...), so English preference still means
 * "translate into English", not "skip translation". Videos not yet translated are batched into
 * a single Gemini call per distinct video set, so a page with 20 never-before-seen videos costs
 * one request, not 20 — and every later view of any of those videos, by anyone, is free.
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
    try {
      const translated = await translateTitlesBulk(
        missing.map((v) => ({ id: v.id, title: v.title })),
        LOCALE_ENGLISH_NAMES[locale]
      );
      await Promise.all(
        translated.map(async (t) => {
          cached.set(t.id, t.title);
          await saveTitleTranslation(t.id, locale, t.title);
        })
      );
    } catch {
      // Translation is best-effort for list titles — fall back to the original title below
      // rather than failing the whole page if Gemini is unavailable or rate-limited.
    }
  }

  return videos.map((v) => (cached.has(v.id) ? { ...v, title: cached.get(v.id)! } : v));
}
