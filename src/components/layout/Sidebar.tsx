"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Podcast, Mic2, Heart, ListMusic, Crown, LogOut, MoreHorizontal, X } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { useMobileNav } from "@/context/MobileNavContext";
import { useLocale } from "@/context/LocaleContext";

const MENU_ITEMS = [
  { key: "podcasts", href: "/podcasts", labelKey: "sidebar.podcasts", icon: Podcast },
  { key: "interviews", href: "/interviews", labelKey: "sidebar.interviews", icon: Mic2 },
] as const;

const LIBRARY_ITEMS = [
  { key: "favourites", href: "/favourites", labelKey: "sidebar.favourites", icon: Heart },
  { key: "playlists", href: "/playlists", labelKey: "sidebar.playlists", icon: ListMusic },
] as const;

function NavGroup({
  heading,
  items,
  pathname,
}: {
  heading: string;
  items: readonly { key: string; href: string; labelKey: string; icon: typeof Podcast }[];
  pathname: string | null;
}) {
  const { t } = useLocale();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-3">
        <p className="text-xs font-bold tracking-[0.15em] text-muted uppercase">{heading}</p>
        <MoreHorizontal size={15} className="text-muted" />
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ key, href, labelKey, icon: Icon }) => {
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
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const { open, close } = useMobileNav();
  const { t } = useLocale();

  return (
    <>
      {open && (
        <div
          onClick={close}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col border-r border-border bg-sidebar px-4 py-6 transition-transform lg:w-56 lg:max-w-none lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-3">
          <Link href="/podcasts" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-extrabold text-accent-ink">
              PX
            </span>
            <span className="text-sm font-bold tracking-tight">PodcastX</span>
          </Link>
          <button onClick={close} className="text-muted lg:hidden">
            <X size={20} />
          </button>
        </div>

      <div className="mt-8 flex flex-col gap-8">
        <NavGroup heading={t("sidebar.menu")} items={MENU_ITEMS} pathname={pathname} />
        <NavGroup heading={t("sidebar.library")} items={LIBRARY_ITEMS} pathname={pathname} />
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-8">
        {userEmail ? (
          <>
            <Link
              href="/profile"
              className="flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition hover:brightness-105"
            >
              <Crown size={16} />
              {t("sidebar.goToPremium")}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface hover:text-foreground"
              >
                <LogOut size={19} strokeWidth={1.75} />
                {t("sidebar.logOut")}
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition hover:brightness-105"
          >
            {t("sidebar.logIn")}
          </Link>
        )}
      </div>
      </aside>
    </>
  );
}
