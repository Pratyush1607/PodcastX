export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { markStaleRunningRunsFailed } = await import("@/lib/supabase/queries");

  // A dev-server restart mid-pipeline leaves `runs` rows stuck at status='running' forever; clean those up on boot.
  await markStaleRunningRunsFailed().catch((err) => {
    console.error("Failed to mark stale runs as failed on boot:", err);
  });

  // Vercel's serverless functions don't host a persistent process, so node-cron would never
  // actually fire there — Vercel Cron (see vercel.json) hits /api/cron/weekly instead in that
  // environment. Only start the in-process scheduler when running as a persistent Node server.
  if (!process.env.VERCEL) {
    const { startWeeklyScheduler } = await import("@/lib/scheduler");
    startWeeklyScheduler();
  }
}
