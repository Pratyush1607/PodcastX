import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVideosByIds } from "@/lib/supabase/queries";
import { getSavedVideoIdSet } from "@/lib/watchLater";
import { withTranslatedTitles } from "@/lib/translateTitles";
import { PlaylistVideoList } from "@/components/content/PlaylistVideoList";
import { DeletePlaylistButton } from "@/components/content/DeletePlaylistButton";
import { getServerT } from "@/lib/serverTranslate";

export const dynamic = "force-dynamic";

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ playlistId: string }>;
}) {
  const { playlistId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: playlist } = await supabase
    .from("playlists")
    .select("id, name")
    .eq("id", playlistId)
    .single();
  if (!playlist) notFound();

  const [{ data: playlistVideos }, savedVideoIds, { locale }] = await Promise.all([
    supabase
      .from("playlist_videos")
      .select("video_id")
      .eq("playlist_id", playlistId)
      .order("created_at", { ascending: false }),
    getSavedVideoIdSet(),
    getServerT(),
  ]);

  const videos = await getVideosByIds((playlistVideos ?? []).map((row) => row.video_id));
  const translatedVideos = await withTranslatedTitles(videos, locale);

  return (
    <div className="px-8 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{playlist.name}</h2>
        <DeletePlaylistButton playlistId={playlist.id} />
      </div>
      <PlaylistVideoList playlistId={playlistId} initialVideos={translatedVideos} savedVideoIds={savedVideoIds} />
    </div>
  );
}
