import { getRun, getRunAgentTasks } from "@/lib/supabase/queries";
import { isAdminAuthorized } from "@/lib/adminAuth";

export async function GET(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { runId } = await params;
  const run = await getRun(runId);
  if (!run) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }
  const tasks = await getRunAgentTasks(runId);
  return Response.json({ run, tasks });
}
