import { notFound } from "next/navigation";
import { CATEGORY_SLUGS } from "@/types/db";
import type { CategorySlug, ContentType } from "@/types/db";
import { getScopePageData } from "@/lib/content";
import { getSavedVideoIdSet } from "@/lib/watchLater";
import { withTranslatedTitles } from "@/lib/translateTitles";
import { TopFiveList } from "@/components/content/TopFiveList";
import { getServerT } from "@/lib/serverTranslate";
import { CATEGORY_LABEL_KEYS } from "@/components/content/CategoryBar";

const VALID_SCOPES: CategorySlug[] = ["overall", ...CATEGORY_SLUGS];

export async function ScopePage({ type, scope }: { type: ContentType; scope: string }) {
  if (!VALID_SCOPES.includes(scope as CategorySlug)) notFound();

  const [{ videos }, savedVideoIds, { t, locale }] = await Promise.all([
    getScopePageData(type, scope as CategorySlug),
    getSavedVideoIdSet(),
    getServerT(),
  ]);
  const translatedVideos = await withTranslatedTitles(videos, locale);
  const kind = type === "podcast" ? t("sidebar.podcasts") : t("sidebar.interviews");
  const label = t(CATEGORY_LABEL_KEYS[scope as CategorySlug]);

  return (
    <div className="space-y-6 px-8 py-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">
          {label} {kind}
        </h2>
        <TopFiveList videos={translatedVideos} savedVideoIds={savedVideoIds} />
      </div>
    </div>
  );
}
