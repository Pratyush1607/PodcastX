import { after } from "next/server";
import { executeTranscriptionPhase } from "@/agents/pm";
import { isAdminAuthorized } from "@/lib/adminAuth";

export const maxDuration = 300;

/** Internal phase-chain hop — only ever called by pm.ts's triggerNextPhase(), never the frontend. */
export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { runId } = await params;

  if (process.env.VERCEL) {
    after(() => executeTranscriptionPhase(runId));
  } else {
    await executeTranscriptionPhase(runId);
  }

  return Response.json({ ok: true });
}
