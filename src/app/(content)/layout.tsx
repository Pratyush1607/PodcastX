import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PlayerProvider } from "@/context/PlayerContext";
import { NowPlayingBar } from "@/components/layout/NowPlayingBar";

export default async function ContentLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <Sidebar userEmail={user?.email ?? null} />
      <PlayerProvider>
        <div className="flex min-h-screen flex-col pl-56">
          <Header userEmail={user?.email ?? null} />
          <main className="flex-1 pb-20">{children}</main>
        </div>
        <NowPlayingBar />
      </PlayerProvider>
    </div>
  );
}
