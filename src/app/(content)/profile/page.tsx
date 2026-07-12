import { redirect } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="px-8 py-6">
      <div className="max-w-sm space-y-6 rounded-2xl bg-surface p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-ink">
            {user.email![0]!.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{user.email}</p>
            <p className="text-sm text-muted">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <form action={signOut}>
          <Button variant="secondary" type="submit" className="w-full">
            Sign out
          </Button>
        </form>
      </div>

      <div className="mt-6 max-w-sm space-y-3 rounded-2xl bg-surface p-6">
        <h2 className="text-xs font-bold tracking-[0.15em] text-muted uppercase">Plans</h2>

        <div className="flex items-center justify-between rounded-xl bg-background px-4 py-3">
          <div>
            <p className="font-semibold">Free</p>
            <p className="text-sm text-muted">Browse, save, and build playlists — no cost.</p>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-accent">
            <Check size={14} />
            Current
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-background px-4 py-3 opacity-60">
          <div>
            <p className="font-semibold">Pro</p>
            <p className="text-sm text-muted">More coming soon.</p>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Clock size={12} />
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
}
