"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORY_SLUGS } from "@/types/db";
import type { ContentType } from "@/types/db";
import { useLocale } from "@/context/LocaleContext";
import { CATEGORY_LABEL_KEYS } from "@/lib/categoryLabels";

const SCOPES = ["overall", ...CATEGORY_SLUGS] as const;

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
