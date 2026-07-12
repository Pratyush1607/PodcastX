"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORY_LABELS, CATEGORY_SLUGS } from "@/types/db";
import type { ContentType } from "@/types/db";

const SCOPES = ["overall", ...CATEGORY_SLUGS] as const;

export function CategoryBar({ type }: { type: ContentType }) {
  const pathname = usePathname();
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
            {CATEGORY_LABELS[scope]}
          </Link>
        );
      })}
    </div>
  );
}
