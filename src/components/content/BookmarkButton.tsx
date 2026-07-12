"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { LoginPromptModal } from "@/components/ui/LoginPromptModal";

export function BookmarkButton({
  videoId,
  initialSaved,
  size = "sm",
}: {
  videoId: string;
  initialSaved: boolean;
  size?: "sm" | "lg";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);

    const res = saved
      ? await fetch(`/api/watch-later/${videoId}`, { method: "DELETE" })
      : await fetch("/api/watch-later", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });

    if (res.status === 401) {
      setShowLoginPrompt(true);
      setLoading(false);
      return;
    }
    if (res.ok) setSaved((s) => !s);
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={toggle}
        disabled={loading}
        title={saved ? "Remove from Favourites" : "Save to Favourites"}
        className={`flex shrink-0 items-center justify-center rounded-full backdrop-blur transition disabled:opacity-50 ${
          size === "lg" ? "h-10 w-10 bg-white/10 hover:bg-white/20" : "h-7 w-7 bg-black/50 hover:bg-black/70"
        }`}
      >
        <Bookmark
          size={size === "lg" ? 20 : 15}
          fill={saved ? "currentColor" : "none"}
          className={saved ? "text-accent" : "text-white"}
        />
      </button>

      {showLoginPrompt && (
        <LoginPromptModal
          message="Log in to save videos to your Favourites."
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
    </>
  );
}
