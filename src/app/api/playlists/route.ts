import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await checkRateLimit(`playlists:${user.id}`))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const videoId = new URL(request.url).searchParams.get("videoId");

  const { data: playlists, error } = await supabase
    .from("playlists")
    .select("id, name")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let memberPlaylistIds = new Set<string>();
  if (videoId && playlists && playlists.length > 0) {
    const { data: memberships } = await supabase
      .from("playlist_videos")
      .select("playlist_id")
      .eq("video_id", videoId)
      .in(
        "playlist_id",
        playlists.map((p) => p.id)
      );
    memberPlaylistIds = new Set((memberships ?? []).map((m) => m.playlist_id));
  }

  return NextResponse.json({
    playlists: (playlists ?? []).map((p) => ({ ...p, isMember: memberPlaylistIds.has(p.id) })),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await checkRateLimit(`playlists:${user.id}`))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { name, videoId } = await request.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data: playlist, error } = await supabase
    .from("playlists")
    .insert({ user_id: user.id, name: name.trim() })
    .select("id, name")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (videoId) {
    const { error: videoError } = await supabase
      .from("playlist_videos")
      .insert({ playlist_id: playlist.id, video_id: videoId });
    if (videoError && videoError.code !== "23505") {
      return NextResponse.json({ error: videoError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ playlist });
}
