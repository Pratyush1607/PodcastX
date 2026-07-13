import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PlaylistsList } from "@/components/content/PlaylistsList";
import { getServerT } from "@/lib/serverTranslate";

export const dynamic = "force-dynamic";

export default async function PlaylistsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { t } = await getServerT();

  if (!user) {
    return (
      <p className="px-8 py-12 text-muted">
        <Link href="/login" className="text-accent underline">
          {t("sidebar.logIn")}
        </Link>{" "}
        {t("playlists.logInToCreate")}
      </p>
    );
  }

  const { data } = await supabase
    .from("playlists")
    .select("id, name, playlist_videos(count)")
    .order("created_at", { ascending: false });

  const playlists = (data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    videoCount: (p.playlist_videos as unknown as { count: number }[])[0]?.count ?? 0,
  }));

  return (
    <div className="px-8 py-6">
      <h2 className="mb-4 text-2xl font-bold">{t("playlists.title")}</h2>
      <PlaylistsList initialPlaylists={playlists} />
    </div>
  );
}
