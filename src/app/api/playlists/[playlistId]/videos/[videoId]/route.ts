import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ playlistId: string; videoId: string }> }
) {
  const { playlistId, videoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await checkRateLimit(`playlists:${user.id}`))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { error } = await supabase
    .from("playlist_videos")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("video_id", videoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
