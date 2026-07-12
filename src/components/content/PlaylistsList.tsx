"use client";

import { useState } from "react";
import Link from "next/link";
import { ListMusic, Plus, Trash2 } from "lucide-react";

interface PlaylistSummary {
  id: string;
  name: string;
  videoCount: number;
}

export function PlaylistsList({ initialPlaylists }: { initialPlaylists: PlaylistSummary[] }) {
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function createPlaylist(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const { playlist } = await res.json();
      setPlaylists((prev) => [{ id: playlist.id, name: playlist.name, videoCount: 0 }, ...prev]);
      setNewName("");
    }
    setCreating(false);
  }

  async function deletePlaylist(id: string) {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/playlists/${id}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createPlaylist} className="flex max-w-md gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New playlist name"
          className="w-full min-w-0 rounded-full border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition hover:brightness-105 disabled:opacity-50"
        >
          <Plus size={16} />
          Create
        </button>
      </form>

      {playlists.length === 0 ? (
        <p className="text-muted">You haven&apos;t created any playlists yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="group flex items-center gap-3 rounded-2xl bg-surface p-4 transition hover:bg-surface-hover"
            >
              <Link href={`/playlists/${playlist.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-accent">
                  <ListMusic size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{playlist.name}</p>
                  <p className="text-xs text-muted">
                    {playlist.videoCount} {playlist.videoCount === 1 ? "video" : "videos"}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => deletePlaylist(playlist.id)}
                title="Delete playlist"
                className="shrink-0 rounded-lg p-2 text-muted opacity-0 transition group-hover:opacity-100 hover:text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
