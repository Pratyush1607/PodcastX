import { CATEGORY_SLUGS } from "@/types/db";
import type { CategorySlug, ContentType } from "@/types/db";
import { getScopePageData } from "@/lib/content";

const VALID_SCOPES: CategorySlug[] = ["overall", ...CATEGORY_SLUGS];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; scope: string }> }
) {
  const { type, scope } = await params;
  if (type !== "podcast" && type !== "interview") {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!VALID_SCOPES.includes(scope as CategorySlug)) {
    return Response.json({ error: "Invalid scope" }, { status: 400 });
  }
  return Response.json(await getScopePageData(type as ContentType, scope as CategorySlug));
}
