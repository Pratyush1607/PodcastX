import { NextResponse } from "next/server";
import { getCachedTranslation, getVideosByIds, saveTranslation } from "@/lib/supabase/queries";
import { translateContent } from "@/lib/gemini";
import { isLocale, LOCALE_ENGLISH_NAMES } from "@/lib/locales";
import { checkRateLimit, requestIp } from "@/lib/rateLimit";

export async function GET(request: Request, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const locale = new URL(request.url).searchParams.get("locale") ?? "";
  if (!isLocale(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  if (!(await checkRateLimit(`translate:${requestIp(request)}`))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const [video] = await getVideosByIds([videoId]);
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const cached = await getCachedTranslation(videoId, locale);
  // A row can exist with only translated_title set (from the list/card title-translation path) —
  // that's not a complete translation if the video actually has summary content, so only treat it
  // as a cache hit once every field the source video actually has is also present in the cache.
  const isComplete =
    !!cached &&
    (video.summary?.summary_text == null || cached.translated_summary_text != null) &&
    (video.summary?.key_points == null || cached.translated_key_points != null) &&
    (video.summary?.notable_quotes == null || cached.translated_notable_quotes != null) &&
    (video.summary?.topics == null || cached.translated_topics != null);

  // video.title here is always the true original from the `videos` table — the caller's own
  // `video` prop may already be showing a list-translated title, so it can't be trusted for this.
  if (isComplete) return NextResponse.json({ translation: cached, originalTitle: video.title });

  const translated = await translateContent(
    {
      title: video.title,
      summaryText: video.summary?.summary_text ?? null,
      keyPoints: video.summary?.key_points ?? null,
      notableQuotes: video.summary?.notable_quotes ?? null,
      topics: video.summary?.topics ?? null,
    },
    LOCALE_ENGLISH_NAMES[locale]
  );

  const translation = {
    translated_title: translated.title,
    translated_summary_text: translated.summaryText,
    translated_key_points: translated.keyPoints,
    translated_notable_quotes: translated.notableQuotes,
    translated_topics: translated.topics,
  };

  await saveTranslation(videoId, locale, translation);
  return NextResponse.json({ translation, originalTitle: video.title });
}
