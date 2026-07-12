import { getHomepageData } from "@/lib/content";
import type { ContentType } from "@/types/db";

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (type !== "podcast" && type !== "interview") {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }
  return Response.json(await getHomepageData(type as ContentType));
}
