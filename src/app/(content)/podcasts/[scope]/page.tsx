import { ScopePage } from "@/components/content/ScopePage";

export const dynamic = "force-dynamic";

export default async function PodcastsScopePage({ params }: { params: Promise<{ scope: string }> }) {
  const { scope } = await params;
  return <ScopePage type="podcast" scope={scope} />;
}
