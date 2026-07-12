"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isDiscoverHomeRoute } from "@/lib/discoverRoutes";

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

  return (
    <header
      className={`flex items-center justify-between border-b border-border px-8 py-5 ${
        onDiscoverHome ? "lg:pr-[336px]" : ""
      }`}
    >
      <h1 className="text-sm font-bold tracking-[0.2em] text-muted uppercase">{title}</h1>

      {onDiscoverHome ? null : userEmail ? (
        <Link
          href="/profile"
          title={userEmail}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink"
        >
          {userEmail[0]!.toUpperCase()}
        </Link>
      ) : (
        <Link href="/login" className="text-sm font-semibold text-muted hover:text-foreground">
          Log in
        </Link>
      )}
    </header>
  );
}
