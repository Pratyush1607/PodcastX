import { getRun, getRunAgentTasks } from "@/lib/supabase/queries";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const run = await getRun(runId);
  if (!run) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }
  const tasks = await getRunAgentTasks(runId);
  return Response.json({ run, tasks });
}
