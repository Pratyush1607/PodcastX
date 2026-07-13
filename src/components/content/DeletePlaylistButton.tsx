"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useLocale } from "@/context/LocaleContext";

export function DeletePlaylistButton({ playlistId }: { playlistId: string }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { t } = useLocale();

  async function handleDelete() {
    if (deleting) return;
    if (!confirm(t("playlists.deleteConfirm"))) return;
    setDeleting(true);
    await fetch(`/api/playlists/${playlistId}`, { method: "DELETE" });
    router.push("/playlists");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-muted transition hover:bg-white/20 hover:text-foreground disabled:opacity-50"
    >
      <Trash2 size={15} />
      {t("playlists.deletePlaylist")}
    </button>
  );
}
