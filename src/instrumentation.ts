export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { markStaleRunningRunsFailed } = await import("@/lib/supabase/queries");
  const { startWeeklyScheduler } = await import("@/lib/scheduler");

  // A dev-server restart mid-pipeline leaves `runs` rows stuck at status='running' forever; clean those up on boot.
  await markStaleRunningRunsFailed().catch((err) => {
    console.error("Failed to mark stale runs as failed on boot:", err);
  });

  startWeeklyScheduler();
}
