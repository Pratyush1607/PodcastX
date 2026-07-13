"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORY_SLUGS } from "@/types/db";
import type { CategorySlug, ContentType } from "@/types/db";
import { useLocale } from "@/context/LocaleContext";

const SCOPES = ["overall", ...CATEGORY_SLUGS] as const;

export const CATEGORY_LABEL_KEYS: Record<CategorySlug, string> = {
  overall: "categoryBar.all",
  tech_ai: "categoryBar.techAi",
  science_education: "categoryBar.scienceEducation",
  sports: "categoryBar.sports",
  health_fitness: "categoryBar.healthFitness",
  comedy: "categoryBar.comedy",
  pop_internet_culture: "categoryBar.popInternetCulture",
};

export function CategoryBar({ type }: { type: ContentType }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const base = type === "podcast" ? "/podcasts" : "/interviews";

  return (
    <div className="scrollbar-hide flex flex-wrap gap-2">
      {SCOPES.map((scope) => {
        const href = scope === "overall" ? base : `${base}/${scope}`;
        const isActive = pathname === href || (scope === "overall" && pathname === base);
        return (
          <Link
            key={scope}
            href={href}
            className={`rounded-full px-5 py-2 text-sm font-semibold whitespace-nowrap transition ${
              isActive
                ? "bg-accent text-accent-ink"
                : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            {t(CATEGORY_LABEL_KEYS[scope])}
          </Link>
        );
      })}
    </div>
  );
}
