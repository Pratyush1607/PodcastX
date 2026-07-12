import { notFound } from "next/navigation";
import { CATEGORY_SLUGS } from "@/types/db";
import type { CategorySlug, ContentType } from "@/types/db";
import { getScopePageData } from "@/lib/content";
import { getSavedVideoIdSet } from "@/lib/watchLater";
import { TopFiveList } from "@/components/content/TopFiveList";

const VALID_SCOPES: CategorySlug[] = ["overall", ...CATEGORY_SLUGS];

export async function ScopePage({ type, scope }: { type: ContentType; scope: string }) {
  if (!VALID_SCOPES.includes(scope as CategorySlug)) notFound();

  const [{ label, videos }, savedVideoIds] = await Promise.all([
    getScopePageData(type, scope as CategorySlug),
    getSavedVideoIdSet(),
  ]);
  const kind = type === "podcast" ? "Podcasts" : "Interviews";

  return (
    <div className="space-y-6 px-8 py-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">
          {label} {kind}
        </h2>
        <TopFiveList videos={videos} savedVideoIds={savedVideoIds} />
      </div>
    </div>
  );
}
