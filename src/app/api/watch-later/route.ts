import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVideosByIds } from "@/lib/supabase/queries";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase
    .from("watch_later")
    .select("video_id")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const videos = await getVideosByIds((data ?? []).map((row) => row.video_id));
  return NextResponse.json({ videos });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { videoId } = await request.json();
  if (!videoId) return NextResponse.json({ error: "videoId is required" }, { status: 400 });

  const { error } = await supabase.from("watch_later").insert({ user_id: user.id, video_id: videoId });
  if (error && error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
