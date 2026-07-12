import cron from "node-cron";
import { runPipeline } from "@/agents/pm";

declare global {
  var __podcastxCronStarted: boolean | undefined;
}

/** Runs every Monday at 08:00 server time. Guarded against double-registration on dev hot reload. */
export function startWeeklyScheduler() {
  if (globalThis.__podcastxCronStarted) return;
  globalThis.__podcastxCronStarted = true;

  cron.schedule("0 8 * * 1", () => {
    runPipeline("scheduled").catch((err) => {
      console.error("Scheduled pipeline run failed:", err);
    });
  });
}
