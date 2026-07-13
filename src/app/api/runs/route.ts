import { after } from "next/server";
import { executeResearchPhase, startRun } from "@/agents/pm";
import { listRuns } from "@/lib/supabase/queries";
import { isAdminAuthorized } from "@/lib/adminAuth";

export const maxDuration = 300;

// Pipeline-management endpoint — not called by the frontend, and burns YouTube/Gemini quota on
// every POST, so it must never be reachable by anonymous callers.
export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const runs = await listRuns();
  return Response.json({ runs });
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const run = await startRun("manual");

  if (process.env.VERCEL) {
    // Each phase (research/transcribe/summarize) runs as its own serverless invocation with its
    // own fresh time budget — see triggerNextPhase() in pm.ts. Kick off phase 1 in the
    // background and respond immediately rather than holding this request open for the whole run.
    after(() => executeResearchPhase(run));
  } else {
    // Locally there's no serverless time limit, so just await the whole chain for easy testing.
    await executeResearchPhase(run);
  }

  return Response.json({ runId: run.id });
}
