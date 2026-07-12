import { executeRun, startRun } from "@/agents/pm";
import { listRuns } from "@/lib/supabase/queries";

export const maxDuration = 300;

export async function GET() {
  const runs = await listRuns();
  return Response.json({ runs });
}

export async function POST() {
  const run = await startRun("manual");

  // Serverless functions don't survive after the response is sent, so the run must be
  // awaited here rather than fired-and-forgotten (as it is when running a persistent
  // Node process locally).
  await executeRun(run);

  return Response.json({ runId: run.id });
}
