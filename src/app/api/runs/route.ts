import { executeRun, startRun } from "@/agents/pm";
import { listRuns } from "@/lib/supabase/queries";

export async function GET() {
  const runs = await listRuns();
  return Response.json({ runs });
}

export async function POST() {
  const run = await startRun("manual");

  // Fire-and-forget: keep executing in this long-lived Node process after responding.
  // executeRun already persists all success/failure state to Supabase, so nothing to await here.
  executeRun(run).catch(() => {});

  return Response.json({ runId: run.id });
}
