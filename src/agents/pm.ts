import { ALL_SCOPES } from "@/agents/types";
import { podcastResearcher } from "@/agents/podcastResearcher";
import { interviewResearcher } from "@/agents/interviewResearcher";
import { transcriber } from "@/agents/transcriber";
import { summarizer } from "@/agents/summarizer";
import { promisePool } from "@/lib/concurrency";
import {
  createRun,
  finalizeRun,
  getRunAgentTasks,
  insertPlacement,
  insertSummary,
  insertTranscript,
  trackAgent,
  upsertVideo,
} from "@/lib/supabase/queries";
import type { RunRow, TranscriptRow } from "@/types/db";
import type { CategorySlug, ContentType, TriggerType } from "@/types/db";

const RESEARCH_CONCURRENCY = 3;
const AGENT_CONCURRENCY = 3;

interface ResearchJob {
  type: ContentType;
  scope: CategorySlug;
}

/** Creates the `runs` row and returns it immediately, without running the pipeline. */
export async function startRun(triggerType: TriggerType): Promise<RunRow> {
  return createRun(triggerType);
}

/** Executes the pipeline for an already-created run (research -> dedupe/placement -> transcribe -> summarize). */
export async function executeRun(run: RunRow): Promise<void> {
  try {
    const researchJobs: ResearchJob[] = ALL_SCOPES.flatMap((scope) => [
      { type: "podcast" as const, scope },
      { type: "interview" as const, scope },
    ]);

    const researchResults = await promisePool(researchJobs, RESEARCH_CONCURRENCY, async (job) => {
      const candidates = await trackAgent(
        {
          runId: run.id,
          agent: job.type === "podcast" ? "podcast_researcher" : "interview_researcher",
          scope: job.scope,
        },
        () => (job.type === "podcast" ? podcastResearcher(job.scope) : interviewResearcher(job.scope))
      );
      return { job, candidates: candidates ?? [] };
    });

    // Dedupe candidates into unique videos (same video can rank in both 'overall' and its category),
    // recording every scope/rank it placed in via video_placements.
    const videoIdByKey = new Map<string, string>();
    const uniqueVideos: { id: string; youtubeVideoId: string }[] = [];

    for (const result of researchResults) {
      if (!result) continue;
      for (let i = 0; i < result.candidates.length; i++) {
        const candidate = result.candidates[i];
        const key = `${result.job.type}:${candidate.youtubeVideoId}`;
        let videoId = videoIdByKey.get(key);
        if (!videoId) {
          const video = await upsertVideo({
            runId: run.id,
            youtubeVideoId: candidate.youtubeVideoId,
            type: result.job.type,
            title: candidate.title,
            channelName: candidate.channelName,
            url: candidate.url,
            viewCount: candidate.viewCount,
            publishedAt: candidate.publishedAt,
            thumbnailUrl: candidate.thumbnailUrl,
          });
          videoId = video.id;
          videoIdByKey.set(key, videoId);
          uniqueVideos.push({ id: videoId, youtubeVideoId: candidate.youtubeVideoId });
        }
        await insertPlacement(videoId, result.job.scope, i + 1);
      }
    }

    const transcriptResults = await promisePool(uniqueVideos, AGENT_CONCURRENCY, async (video) => {
      const transcriptResult = await trackAgent(
        { runId: run.id, agent: "transcriber", videoId: video.id },
        () => transcriber(video.youtubeVideoId)
      );
      if (!transcriptResult) return null;
      const transcript = await insertTranscript({
        videoId: video.id,
        source: transcriptResult.source,
        language: transcriptResult.language,
        content: transcriptResult.content,
      });
      return { videoId: video.id, transcript };
    });

    const successfulTranscripts = transcriptResults.filter(
      (r): r is { videoId: string; transcript: TranscriptRow } => r !== null
    );

    await promisePool(successfulTranscripts, AGENT_CONCURRENCY, async ({ videoId, transcript }) => {
      const summaryResult = await trackAgent({ runId: run.id, agent: "summarizer", videoId }, () =>
        summarizer(transcript.content)
      );
      if (!summaryResult) return null;
      return insertSummary({
        transcriptId: transcript.id,
        keyPoints: summaryResult.keyPoints,
        notableQuotes: summaryResult.notableQuotes,
        topics: summaryResult.topics,
        summaryText: summaryResult.summaryText,
      });
    });

    const tasks = await getRunAgentTasks(run.id);
    const hasSucceeded = tasks.some((t) => t.status === "succeeded");
    const hasFailed = tasks.some((t) => t.status === "failed");
    const status = !hasSucceeded ? "failed" : hasFailed ? "partial" : "completed";
    await finalizeRun(run.id, status);
  } catch (err) {
    await finalizeRun(run.id, "failed", err instanceof Error ? err.message : String(err));
  }
}

/** Convenience wrapper for scripts/cron: creates the run and awaits full completion. */
export async function runPipeline(triggerType: TriggerType): Promise<string> {
  const run = await startRun(triggerType);
  await executeRun(run);
  return run.id;
}
