import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PlayerProvider } from "@/context/PlayerContext";
import { NowPlayingBar } from "@/components/layout/NowPlayingBar";
import { MobileNavProvider } from "@/context/MobileNavContext";

// Gives after()-scheduled background work (e.g. warming the title-translation cache) enough
// time to actually finish post-response, instead of being cut off at the platform default.
export const maxDuration = 60;

export default async function ContentLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <MobileNavProvider>
      <div>
        <Sidebar userEmail={user?.email ?? null} />
        <PlayerProvider>
          <div className="flex min-h-screen flex-col lg:pl-56">
            <Header userEmail={user?.email ?? null} />
            <main className="flex-1 pb-28">{children}</main>
          </div>
          <NowPlayingBar />
        </PlayerProvider>
      </div>
    </MobileNavProvider>
  );
}
