import { getHomepageData } from "@/lib/content";
import type { ContentType } from "@/types/db";
import { checkRateLimit, requestIp } from "@/lib/rateLimit";

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  if (!(await checkRateLimit(`content:${requestIp(request)}`))) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { type } = await params;
  if (type !== "podcast" && type !== "interview") {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }
  return Response.json(await getHomepageData(type as ContentType));
}
