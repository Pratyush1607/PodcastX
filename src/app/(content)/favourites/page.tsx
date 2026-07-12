import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getVideosByIds } from "@/lib/supabase/queries";
import { TopFiveList } from "@/components/content/TopFiveList";

export const dynamic = "force-dynamic";

export default async function FavouritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <p className="px-8 py-12 text-muted">
        <Link href="/login" className="text-accent underline">
          Log in
        </Link>{" "}
        to save podcasts and interviews to your favourites.
      </p>
    );
  }

  const { data } = await supabase
    .from("watch_later")
    .select("video_id")
    .order("created_at", { ascending: false });
  const videos = await getVideosByIds((data ?? []).map((row) => row.video_id));
  const savedVideoIds = new Set(videos.map((v) => v.id));

  return (
    <div className="px-8 py-6">
      <h2 className="mb-4 text-2xl font-bold">Favourites</h2>
      {videos.length === 0 ? (
        <p className="text-muted">
          Nothing saved yet — tap the bookmark icon on any podcast or interview to add it here.
        </p>
      ) : (
        <TopFiveList videos={videos} savedVideoIds={savedVideoIds} />
      )}
    </div>
  );
}
