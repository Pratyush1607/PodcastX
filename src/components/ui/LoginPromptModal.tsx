"use client";

import Link from "next/link";

export function LoginPromptModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold">Log in required</h3>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-white/10 hover:text-foreground"
          >
            Not now
          </button>
          <Link
            href="/login"
            className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-ink transition hover:brightness-105"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
