"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { ApiVideo } from "@/types/api";

export function NotificationBell({ recentSaves }: { recentSaves: ApiVideo[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface text-muted transition hover:text-foreground"
      >
        <Bell size={18} />
        {recentSaves.length > 0 && (
          <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-accent" />
        )}
      </button>

      {open && (
        <div className="absolute top-12 right-0 left-auto z-30 w-72 max-w-[80vw] rounded-2xl bg-surface p-2 shadow-xl sm:w-80 lg:fixed lg:top-20 lg:right-6 lg:w-[272px] lg:max-w-none">
          <p className="px-3 pt-2 pb-1 text-xs font-bold tracking-[0.15em] text-muted uppercase">
            Recently saved
          </p>
          {recentSaves.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">
              Nothing saved yet — tap the bookmark icon on a video to add it here.
            </p>
          ) : (
            <div className="flex flex-col">
              {recentSaves.map((video) => (
                <Link
                  key={video.id}
                  href="/favourites"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-surface-hover"
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
              ))}
            </div>
          )}
          <Link
            href="/favourites"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-xl px-3 py-2 text-center text-xs font-semibold text-accent transition hover:bg-surface-hover"
          >
            View all Favourites
          </Link>
        </div>
      )}
    </div>
  );
}
