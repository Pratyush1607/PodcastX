"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ListPlus, Check, Plus } from "lucide-react";

interface PlaylistOption {
  id: string;
  name: string;
  isMember: boolean;
}

export function AddToPlaylistButton({ videoId, size = "sm" }: { videoId: string; size?: "sm" | "lg" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistOption[] | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function loadPlaylists() {
    setLoading(true);
    const res = await fetch(`/api/playlists?videoId=${videoId}`);
    if (res.status === 401) {
      router.push("/login");
      setOpen(false);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setPlaylists(data.playlists ?? []);
    setLoading(false);
  }

  async function handleOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen((o) => !o);
    if (!open) await loadPlaylists();
  }

  async function toggleMembership(playlist: PlaylistOption) {
    setPlaylists((prev) =>
      prev!.map((p) => (p.id === playlist.id ? { ...p, isMember: !p.isMember } : p))
    );
    if (playlist.isMember) {
      await fetch(`/api/playlists/${playlist.id}/videos/${videoId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/playlists/${playlist.id}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
    }
  }

  async function createPlaylist(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), videoId }),
    });
    if (res.ok) {
      const { playlist } = await res.json();
      setPlaylists((prev) => [{ id: playlist.id, name: playlist.name, isMember: true }, ...(prev ?? [])]);
      setNewName("");
    }
    setCreating(false);
  }

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleOpen}
        title="Add to playlist"
        className={`flex shrink-0 items-center justify-center rounded-full backdrop-blur transition ${
          size === "lg" ? "h-10 w-10 bg-white/10 hover:bg-white/20" : "h-7 w-7 bg-black/50 hover:bg-black/70"
        }`}
      >
        <ListPlus size={size === "lg" ? 20 : 15} className="text-white" />
      </button>

      {open && (
        <div className="absolute top-9 right-0 z-30 w-64 rounded-2xl bg-surface p-2 shadow-xl">
          <p className="px-2 pt-1 pb-2 text-xs font-bold tracking-[0.1em] text-muted uppercase">
            Add to playlist
          </p>

          {loading && <p className="px-2 py-2 text-sm text-muted">Loading…</p>}

          {!loading && playlists && playlists.length === 0 && (
            <p className="px-2 py-2 text-sm text-muted">No playlists yet — create one below.</p>
          )}

          {!loading && playlists && playlists.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => toggleMembership(playlist)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left text-sm transition hover:bg-surface-hover"
                >
                  <span className="truncate">{playlist.name}</span>
                  {playlist.isMember && <Check size={16} className="shrink-0 text-accent" />}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={createPlaylist} className="mt-2 flex gap-1.5 border-t border-border pt-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New playlist"
              className="w-full min-w-0 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-ink disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
