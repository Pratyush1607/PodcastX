import { ScopePage } from "@/components/content/ScopePage";

export const dynamic = "force-dynamic";

export default async function InterviewsScopePage({ params }: { params: Promise<{ scope: string }> }) {
  const { scope } = await params;
  return <ScopePage type="interview" scope={scope} />;
}
