"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import type { ApiVideo } from "@/types/api";
import { useLocale } from "@/context/LocaleContext";

export function NotificationBell({ recentSaves }: { recentSaves: ApiVideo[] }) {
  const [open, setOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const visibleSaves = recentSaves.filter((video) => !dismissedIds.has(video.id));

  function dismiss(videoId: string) {
    setDismissedIds((prev) => new Set(prev).add(videoId));
  }

  function dismissAll() {
    setDismissedIds(new Set(recentSaves.map((video) => video.id)));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface text-muted transition hover:text-foreground"
      >
        <Bell size={18} />
        {visibleSaves.length > 0 && (
          <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-accent" />
        )}
      </button>

      {open && (
        <div className="absolute top-12 right-0 left-auto z-30 w-72 max-w-[80vw] rounded-2xl bg-surface p-2 shadow-xl sm:w-80 lg:fixed lg:top-20 lg:right-6 lg:w-[272px] lg:max-w-none">
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <p className="text-xs font-bold tracking-[0.15em] text-muted uppercase">
              {t("notifications.recentlySaved")}
            </p>
            {visibleSaves.length > 0 && (
              <button
                onClick={dismissAll}
                className="text-xs font-semibold text-muted transition hover:text-foreground"
              >
                {t("notifications.clearAll")}
              </button>
            )}
          </div>
          {visibleSaves.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">{t("notifications.nothingSavedYet")}</p>
          ) : (
            <div className="flex flex-col">
              {visibleSaves.map((video) => (
                <div
                  key={video.id}
                  className="group flex items-center gap-1 rounded-xl transition hover:bg-surface-hover"
                >
                  <Link
                    href="/favourites"
                    onClick={() => setOpen(false)}
                    className="flex min-w-0 flex-1 items-center gap-3 p-2"
                  >
                    {video.thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnail_url}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{video.title}</p>
                      <p className="truncate text-xs text-muted">{video.channel_name}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => dismiss(video.id)}
                    title={t("notifications.dismiss")}
                    className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/favourites"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-xl px-3 py-2 text-center text-xs font-semibold text-accent transition hover:bg-surface-hover"
          >
            {t("notifications.viewAllFavourites")}
          </Link>
        </div>
      )}
    </div>
  );
}
