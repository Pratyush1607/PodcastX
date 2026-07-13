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
  getRunUnsummarizedTranscripts,
  getRunUntranscribedVideos,
  insertPlacement,
  insertSummary,
  insertTranscript,
  trackAgent,
  upsertVideo,
} from "@/lib/supabase/queries";
import type { RunRow } from "@/types/db";
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

/**
 * Fires the next phase. On Vercel each serverless invocation gets its own maxDuration budget
 * (300s on this project's plan) — a full run needs more Gemini calls than comfortably fit in
 * one invocation once the client-side rate limiter's pacing is accounted for, so each phase
 * runs as an independent HTTP-triggered invocation instead of one long in-process chain.
 * Locally there's no such limit, so the next phase just runs directly in the same process.
 */
async function triggerNextPhase(runId: string, phase: "transcribe" | "summarize"): Promise<void> {
  if (!process.env.VERCEL) {
    if (phase === "transcribe") await executeTranscriptionPhase(runId);
    else await executeSummarizationPhase(runId);
    return;
  }

  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  const secret = process.env.CRON_SECRET;
  await fetch(`https://${host}/api/runs/${runId}/${phase}`, {
    method: "POST",
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  });
}

/** Phase 1: research every scope, dedupe candidates into unique videos, record scope/rank placements. */
export async function executeResearchPhase(run: RunRow): Promise<void> {
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
        }
        await insertPlacement(videoId, result.job.scope, i + 1);
      }
    }

    await triggerNextPhase(run.id, "transcribe");
  } catch (err) {
    await finalizeRun(run.id, "failed", err instanceof Error ? err.message : String(err));
  }
}

/**
 * Phase 2: transcribe every unique video from this run that doesn't have a transcript yet.
 * Re-fetches the video list from the DB rather than receiving it in-memory, so this phase can
 * run as its own separate invocation (or safely retry) independent of phase 1's process.
 */
export async function executeTranscriptionPhase(runId: string): Promise<void> {
  try {
    const videos = await getRunUntranscribedVideos(runId);

    await promisePool(videos, AGENT_CONCURRENCY, async (video) => {
      const transcriptResult = await trackAgent(
        { runId, agent: "transcriber", videoId: video.id },
        () => transcriber(video.youtubeVideoId)
      );
      if (!transcriptResult) return null;
      return insertTranscript({
        videoId: video.id,
        source: transcriptResult.source,
        language: transcriptResult.language,
        content: transcriptResult.content,
      });
    });

    await triggerNextPhase(runId, "summarize");
  } catch (err) {
    await finalizeRun(runId, "failed", err instanceof Error ? err.message : String(err));
  }
}

/** Phase 3: summarize every transcript from this run that doesn't have a summary yet, then finalize the run. */
export async function executeSummarizationPhase(runId: string): Promise<void> {
  try {
    const transcripts = await getRunUnsummarizedTranscripts(runId);

    await promisePool(transcripts, AGENT_CONCURRENCY, async ({ videoId, transcript }) => {
      const summaryResult = await trackAgent({ runId, agent: "summarizer", videoId }, () =>
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

    const tasks = await getRunAgentTasks(runId);
    const hasSucceeded = tasks.some((t) => t.status === "succeeded");
    const hasFailed = tasks.some((t) => t.status === "failed");
    const status = !hasSucceeded ? "failed" : hasFailed ? "partial" : "completed";
    await finalizeRun(runId, status);
  } catch (err) {
    await finalizeRun(runId, "failed", err instanceof Error ? err.message : String(err));
  }
}

/** Convenience wrapper for local scripts/cron: creates the run and awaits full completion (only
 *  meaningful locally, where every phase runs in-process with no time limit). */
export async function runPipeline(triggerType: TriggerType): Promise<string> {
  const run = await startRun(triggerType);
  await executeResearchPhase(run);
  return run.id;
}
