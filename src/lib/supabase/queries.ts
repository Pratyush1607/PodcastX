import { supabase } from "@/lib/supabase/client";
import type {
  AgentName,
  AgentStatus,
  CategorySlug,
  ContentType,
  RunAgentTaskRow,
  RunRow,
  RunStatus,
  SummaryRow,
  TranscriptRow,
  TranscriptSource,
  TriggerType,
  VideoRow,
} from "@/types/db";

export async function createRun(triggerType: TriggerType): Promise<RunRow> {
  const { data, error } = await supabase
    .from("runs")
    .insert({ trigger_type: triggerType, status: "running" satisfies RunStatus })
    .select()
    .single();
  if (error) throw error;
  return data as RunRow;
}

export async function finalizeRun(runId: string, status: RunStatus, errorSummary?: string) {
  const { error } = await supabase
    .from("runs")
    .update({ status, completed_at: new Date().toISOString(), error_summary: errorSummary ?? null })
    .eq("id", runId);
  if (error) throw error;
}

export async function markStaleRunningRunsFailed() {
  const { error } = await supabase
    .from("runs")
    .update({
      status: "failed" satisfies RunStatus,
      completed_at: new Date().toISOString(),
      error_summary: "Orphaned by server restart while run was in progress",
    })
    .eq("status", "running");
  if (error) throw error;
}

export async function startAgentTask(params: {
  runId: string;
  agent: AgentName;
  videoId?: string;
  scope?: CategorySlug;
}): Promise<RunAgentTaskRow> {
  const { data, error } = await supabase
    .from("run_agent_tasks")
    .insert({
      run_id: params.runId,
      agent: params.agent,
      video_id: params.videoId ?? null,
      scope: params.scope ?? null,
      status: "running" satisfies AgentStatus,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as RunAgentTaskRow;
}

export async function completeAgentTask(
  taskId: string,
  status: Extract<AgentStatus, "succeeded" | "failed" | "skipped">,
  errorMessage?: string
) {
  const { error } = await supabase
    .from("run_agent_tasks")
    .update({
      status,
      completed_at: new Date().toISOString(),
      error_message: errorMessage ?? null,
    })
    .eq("id", taskId);
  if (error) throw error;
}

/** Wraps an agent call: records running -> succeeded/failed, never throws (returns null on failure). */
export async function trackAgent<T>(
  params: { runId: string; agent: AgentName; videoId?: string; scope?: CategorySlug },
  fn: () => Promise<T>
): Promise<T | null> {
  const task = await startAgentTask(params);
  try {
    const result = await fn();
    await completeAgentTask(task.id, "succeeded");
    return result;
  } catch (err) {
    await completeAgentTask(task.id, "failed", err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function upsertVideo(video: {
  runId: string;
  youtubeVideoId: string;
  type: ContentType;
  title: string;
  channelName: string;
  url: string;
  viewCount: number;
  publishedAt: string;
  thumbnailUrl?: string;
}): Promise<VideoRow> {
  const { data, error } = await supabase
    .from("videos")
    .upsert(
      {
        run_id: video.runId,
        youtube_video_id: video.youtubeVideoId,
        type: video.type,
        title: video.title,
        channel_name: video.channelName,
        url: video.url,
        view_count: video.viewCount,
        published_at: video.publishedAt,
        thumbnail_url: video.thumbnailUrl ?? null,
      },
      { onConflict: "run_id,youtube_video_id,type" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as VideoRow;
}

export async function insertPlacement(videoId: string, scope: CategorySlug, rank: number) {
  const { error } = await supabase
    .from("video_placements")
    .upsert({ video_id: videoId, scope, rank }, { onConflict: "video_id,scope" });
  if (error) throw error;
}

export async function insertTranscript(params: {
  videoId: string;
  source: TranscriptSource;
  language?: string;
  content: string;
}): Promise<TranscriptRow> {
  const { data, error } = await supabase
    .from("transcripts")
    .upsert(
      {
        video_id: params.videoId,
        source: params.source,
        language: params.language ?? null,
        content: params.content,
        word_count: params.content.split(/\s+/).filter(Boolean).length,
      },
      { onConflict: "video_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as TranscriptRow;
}

export async function insertSummary(params: {
  transcriptId: string;
  keyPoints: string[];
  notableQuotes: { quote: string; speaker?: string }[];
  topics: string[];
  summaryText: string;
}): Promise<SummaryRow> {
  const { data, error } = await supabase
    .from("summaries")
    .upsert(
      {
        transcript_id: params.transcriptId,
        key_points: params.keyPoints,
        notable_quotes: params.notableQuotes,
        topics: params.topics,
        summary_text: params.summaryText,
      },
      { onConflict: "transcript_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as SummaryRow;
}

export async function getRun(runId: string): Promise<RunRow | null> {
  const { data, error } = await supabase.from("runs").select().eq("id", runId).maybeSingle();
  if (error) throw error;
  return data as RunRow | null;
}

export async function listRuns(limit = 20): Promise<RunRow[]> {
  const { data, error } = await supabase
    .from("runs")
    .select()
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as RunRow[];
}

export async function getRunAgentTasks(runId: string): Promise<RunAgentTaskRow[]> {
  const { data, error } = await supabase
    .from("run_agent_tasks")
    .select()
    .eq("run_id", runId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as RunAgentTaskRow[];
}

export async function getLatestRunId(type?: ContentType): Promise<string | null> {
  void type;
  const { data, error } = await supabase
    .from("runs")
    .select("id")
    .in("status", ["completed", "partial"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export interface ScopeVideo extends VideoRow {
  rank: number;
  transcript: TranscriptRow | null;
  summary: SummaryRow | null;
}

/** Fetches videos (with transcript/summary joined) for an explicit, ordered list of video IDs — used by Watch Later. */
export async function getVideosByIds(videoIds: string[]): Promise<ScopeVideo[]> {
  if (videoIds.length === 0) return [];

  const { data: videos, error } = await supabase.from("videos").select().in("id", videoIds);
  if (error) throw error;

  const videoById = new Map((videos ?? []).map((v) => [v.id, v as VideoRow]));

  const { data: transcripts } = await supabase.from("transcripts").select().in("video_id", videoIds);
  const transcriptByVideo = new Map((transcripts ?? []).map((t) => [t.video_id, t as TranscriptRow]));

  const transcriptIds = (transcripts ?? []).map((t) => t.id);
  const { data: summaries } = transcriptIds.length
    ? await supabase.from("summaries").select().in("transcript_id", transcriptIds)
    : { data: [] as SummaryRow[] };
  const summaryByTranscript = new Map((summaries ?? []).map((s) => [s.transcript_id, s as SummaryRow]));

  return videoIds
    .map((id, i) => {
      const video = videoById.get(id);
      if (!video) return null;
      const transcript = transcriptByVideo.get(id) ?? null;
      const summary = transcript ? (summaryByTranscript.get(transcript.id) ?? null) : null;
      return { ...video, rank: i + 1, transcript, summary };
    })
    .filter((v): v is ScopeVideo => v !== null);
}

export async function getScopeVideos(
  runId: string,
  type: ContentType,
  scope: CategorySlug
): Promise<ScopeVideo[]> {
  const { data: placements, error } = await supabase
    .from("video_placements")
    .select("rank, video_id, videos!inner(*)")
    .eq("scope", scope)
    .eq("videos.run_id", runId)
    .eq("videos.type", type)
    .order("rank", { ascending: true });
  if (error) throw error;

  const rows = (placements ?? []) as unknown as {
    rank: number;
    video_id: string;
    videos: VideoRow;
  }[];
  if (rows.length === 0) return [];

  const videoIds = rows.map((r) => r.video_id);
  const { data: transcripts } = await supabase
    .from("transcripts")
    .select()
    .in("video_id", videoIds);
  const transcriptByVideo = new Map((transcripts ?? []).map((t) => [t.video_id, t as TranscriptRow]));

  const transcriptIds = (transcripts ?? []).map((t) => t.id);
  const { data: summaries } = transcriptIds.length
    ? await supabase.from("summaries").select().in("transcript_id", transcriptIds)
    : { data: [] as SummaryRow[] };
  const summaryByTranscript = new Map((summaries ?? []).map((s) => [s.transcript_id, s as SummaryRow]));

  return rows.map((r) => {
    const transcript = transcriptByVideo.get(r.video_id) ?? null;
    const summary = transcript ? summaryByTranscript.get(transcript.id) ?? null : null;
    return { ...r.videos, rank: r.rank, transcript, summary };
  });
}

export interface CategoryViewTotal {
  scope: CategorySlug;
  totalViews: number;
}

/** Total view count per category (excluding 'overall') for a run+type, used to pick the 4 homepage tiles. */
export async function getCategoryViewTotals(
  runId: string,
  type: ContentType
): Promise<CategoryViewTotal[]> {
  const { data, error } = await supabase
    .from("video_placements")
    .select("scope, videos!inner(view_count, run_id, type)")
    .neq("scope", "overall")
    .eq("videos.run_id", runId)
    .eq("videos.type", type);
  if (error) throw error;

  const rows = (data ?? []) as unknown as { scope: CategorySlug; videos: { view_count: number | null } }[];
  const totals = new Map<CategorySlug, number>();
  for (const row of rows) {
    totals.set(row.scope, (totals.get(row.scope) ?? 0) + (row.videos.view_count ?? 0));
  }
  return Array.from(totals.entries()).map(([scope, totalViews]) => ({ scope, totalViews }));
}
