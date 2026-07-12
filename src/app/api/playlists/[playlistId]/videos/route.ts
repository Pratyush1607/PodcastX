import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request, { params }: { params: Promise<{ playlistId: string }> }) {
  const { playlistId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await checkRateLimit(`playlists:${user.id}`))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { videoId } = await request.json();
  if (!videoId) return NextResponse.json({ error: "videoId is required" }, { status: 400 });

  const { error } = await supabase
    .from("playlist_videos")
    .insert({ playlist_id: playlistId, video_id: videoId });
  if (error && error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
