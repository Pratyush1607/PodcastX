import { executeRun, startRun } from "@/agents/pm";

/** Hit by the local node-cron scheduler; also the endpoint to point Vercel Cron at later. */
export async function POST() {
  const run = await startRun("scheduled");
  executeRun(run).catch(() => {});
  return Response.json({ runId: run.id });
}
