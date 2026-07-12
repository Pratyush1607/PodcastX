import { executeRun, startRun } from "@/agents/pm";
import { isAdminAuthorized } from "@/lib/adminAuth";

export const maxDuration = 300;

async function runScheduled(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const run = await startRun("scheduled");
  await executeRun(run);
  return Response.json({ runId: run.id });
}

/** Hit by Vercel Cron on its configured schedule (see vercel.json), sending Bearer <CRON_SECRET>. */
export async function GET(request: Request) {
  return runScheduled(request);
}

/** Kept for the local node-cron scheduler and manual triggering during development. */
export async function POST(request: Request) {
  return runScheduled(request);
}
