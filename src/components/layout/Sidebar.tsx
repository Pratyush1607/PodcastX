"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Podcast, Mic2, Heart, ListMusic, Crown, LogOut, MoreHorizontal } from "lucide-react";
import { signOut } from "@/app/actions/auth";

const MENU_ITEMS = [
  { key: "podcasts", href: "/podcasts", label: "Podcasts", icon: Podcast },
  { key: "interviews", href: "/interviews", label: "Interviews", icon: Mic2 },
] as const;

const LIBRARY_ITEMS = [
  { key: "favourites", href: "/favourites", label: "Favourites", icon: Heart },
  { key: "playlists", href: "/playlists", label: "Playlists", icon: ListMusic },
] as const;

function NavGroup({
  heading,
  items,
  pathname,
}: {
  heading: string;
  items: readonly { key: string; href: string; label: string; icon: typeof Podcast }[];
  pathname: string | null;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-3">
        <p className="text-xs font-bold tracking-[0.15em] text-muted uppercase">{heading}</p>
        <MoreHorizontal size={15} className="text-muted" />
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ key, href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              <Icon size={19} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-border bg-sidebar px-4 py-6">
      <Link href="/podcasts" className="flex items-center gap-2 px-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-extrabold text-accent-ink">
          PX
        </span>
        <span className="text-sm font-bold tracking-tight">PodcastX</span>
      </Link>

      <div className="mt-8 flex flex-col gap-8">
        <NavGroup heading="Menu" items={MENU_ITEMS} pathname={pathname} />
        <NavGroup heading="Library" items={LIBRARY_ITEMS} pathname={pathname} />
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-8">
        {userEmail ? (
          <>
            <Link
              href="/profile"
              className="flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition hover:brightness-105"
            >
              <Crown size={16} />
              Go to Premium
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface hover:text-foreground"
              >
                <LogOut size={19} strokeWidth={1.75} />
                Log out
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition hover:brightness-105"
          >
            Log in
          </Link>
        )}
      </div>
    </aside>
  );
}
