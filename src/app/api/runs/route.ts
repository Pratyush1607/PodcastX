import { executeRun, startRun } from "@/agents/pm";
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

  // Serverless functions don't survive after the response is sent, so the run must be
  // awaited here rather than fired-and-forgotten (as it is when running a persistent
  // Node process locally).
  await executeRun(run);

  return Response.json({ runId: run.id });
}
