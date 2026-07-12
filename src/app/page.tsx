import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/podcasts");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-lg font-extrabold text-accent-ink">
          PX
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">PodcastX</h1>
        <p className="mt-2 max-w-sm text-muted">
          Top podcasts and interviews of the week, researched and summarized by AI agents.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/login">
          <Button>Log in</Button>
        </Link>
        <Link href="/signup">
          <Button variant="secondary">Sign up</Button>
        </Link>
      </div>

      <Link href="/podcasts" className="text-sm text-muted underline hover:text-foreground">
        Continue browsing without an account
      </Link>
    </div>
  );
}
