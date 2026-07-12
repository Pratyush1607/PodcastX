import { executeRun, startRun } from "@/agents/pm";

export const maxDuration = 300;

/** Vercel Cron sends a GET with `Authorization: Bearer <CRON_SECRET>`; require it whenever it's configured. */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function runScheduled(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const run = await startRun("scheduled");
  await executeRun(run);
  return Response.json({ runId: run.id });
}

/** Hit by Vercel Cron on its configured schedule (see vercel.json). */
export async function GET(request: Request) {
  return runScheduled(request);
}

/** Kept for the local node-cron scheduler and manual triggering during development. */
export async function POST(request: Request) {
  return runScheduled(request);
}
