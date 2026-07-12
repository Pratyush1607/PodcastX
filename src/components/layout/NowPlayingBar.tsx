"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MoreHorizontal, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { GLOBAL_PLAYER_ELEMENT_ID, usePlayer } from "@/context/PlayerContext";
import { isDiscoverHomeRoute } from "@/lib/discoverRoutes";

const BAR_COUNT = 40;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function seededBarHeights(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const bars: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    bars.push(0.25 + ((h >>> 8) % 1000) / 1000 / 1.35);
  }
  return bars;
}

export function NowPlayingBar() {
  const { current, playing, currentTime, duration, hasQueue, togglePlay, next, previous, seekToFraction, close } =
    usePlayer();
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const bars = useMemo(() => seededBarHeights(current?.youtubeVideoId ?? "idle"), [current?.youtubeVideoId]);
  const progress = duration > 0 ? currentTime / duration : 0;

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const el = waveformRef.current;
    if (!el || !current) return;
    const rect = el.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seekToFraction(fraction);
  }

  return (
    <div
      className={`fixed bottom-0 left-0 z-40 flex flex-col gap-1.5 border-t border-border bg-surface px-3 py-2 sm:px-4 sm:py-3 lg:left-56 ${
        isDiscoverHomeRoute(pathname) ? "right-0 lg:right-80" : "right-0"
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-black sm:h-14 sm:w-14">
          <div id={GLOBAL_PLAYER_ELEMENT_ID} />
        </div>

        <div className="min-w-0 flex-1">
          {current ? (
            <>
              <p className="truncate text-sm font-semibold">{current.title}</p>
              <p className="truncate text-xs text-muted">{current.channelName}</p>
            </>
          ) : (
            <p className="truncate text-sm text-muted">Nothing playing</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            onClick={previous}
            disabled={!hasQueue}
            title="Previous"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-white/10 hover:text-foreground disabled:opacity-30"
          >
            <SkipBack size={16} />
          </button>

          <button
            onClick={togglePlay}
            disabled={!current}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-ink transition hover:brightness-105 disabled:opacity-30 sm:h-10 sm:w-10"
          >
            {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>

          <button
            onClick={next}
            disabled={!hasQueue}
            title="Next"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-white/10 hover:text-foreground disabled:opacity-30"
          >
            <SkipForward size={16} />
          </button>
        </div>

        <div ref={menuRef} className="relative hidden shrink-0 sm:block">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            disabled={!current}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-white/10 hover:text-foreground disabled:opacity-30"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-11 z-10 w-40 rounded-xl bg-surface-hover p-1 shadow-xl">
              <button
                onClick={() => {
                  close();
                  setMenuOpen(false);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition hover:bg-white/10 hover:text-foreground"
              >
                Stop playback
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <div
          ref={waveformRef}
          onClick={handleSeek}
          className="flex h-5 cursor-pointer items-center gap-[2px] sm:h-6 sm:gap-[3px]"
        >
          {bars.map((h, i) => (
            <div
              key={i}
              className={`w-full rounded-full transition-colors ${
                current && i / BAR_COUNT <= progress ? "bg-accent" : "bg-white/15"
              }`}
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
