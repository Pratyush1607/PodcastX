import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getVideosByIds } from "@/lib/supabase/queries";
import { withTranslatedTitles } from "@/lib/translateTitles";
import { TopFiveList } from "@/components/content/TopFiveList";
import { getServerT } from "@/lib/serverTranslate";

export const dynamic = "force-dynamic";

export default async function FavouritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { t, locale } = await getServerT();

  if (!user) {
    return (
      <p className="px-8 py-12 text-muted">
        <Link href="/login" className="text-accent underline">
          {t("sidebar.logIn")}
        </Link>{" "}
        {t("favourites.logInToSave")}
      </p>
    );
  }

  const { data } = await supabase
    .from("watch_later")
    .select("video_id")
    .order("created_at", { ascending: false });
  const videos = await getVideosByIds((data ?? []).map((row) => row.video_id));
  const translatedVideos = await withTranslatedTitles(videos, locale);
  const savedVideoIds = new Set(videos.map((v) => v.id));

  return (
    <div className="px-8 py-6">
      <h2 className="mb-4 text-2xl font-bold">{t("favourites.title")}</h2>
      {videos.length === 0 ? (
        <p className="text-muted">{t("favourites.nothingSavedYet")}</p>
      ) : (
        <TopFiveList videos={translatedVideos} savedVideoIds={savedVideoIds} />
      )}
    </div>
  );
}
