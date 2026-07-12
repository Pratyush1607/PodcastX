"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { isDiscoverHomeRoute } from "@/lib/discoverRoutes";
import { useMobileNav } from "@/context/MobileNavContext";

const TITLES: { prefix: string; title: string }[] = [
  { prefix: "/podcasts", title: "Discover Podcasts" },
  { prefix: "/interviews", title: "Discover Interviews" },
  { prefix: "/favourites", title: "Favourites" },
  { prefix: "/playlists", title: "Playlists" },
];

export function Header({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname() ?? "";
  const title = TITLES.find((t) => pathname.startsWith(t.prefix))?.title ?? "PodcastX";
  const onDiscoverHome = isDiscoverHomeRoute(pathname);
  const { toggle } = useMobileNav();

  return (
    <header
      className={`flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-8 sm:py-5 ${
        onDiscoverHome ? "lg:pr-[336px]" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={toggle} className="shrink-0 text-muted lg:hidden">
          <Menu size={22} />
        </button>
        <h1 className="truncate text-xs font-bold tracking-[0.2em] text-muted uppercase sm:text-sm">
          {title}
        </h1>
      </div>

      {onDiscoverHome ? null : userEmail ? (
        <Link
          href="/profile"
          title={userEmail}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink"
        >
          {userEmail[0]!.toUpperCase()}
        </Link>
      ) : (
        <Link href="/login" className="shrink-0 text-sm font-semibold text-muted hover:text-foreground">
          Log in
        </Link>
      )}
    </header>
  );
}
