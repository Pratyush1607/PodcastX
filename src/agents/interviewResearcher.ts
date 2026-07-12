import { searchTopFive } from "@/lib/youtube";
import type { CategorySlug } from "@/types/db";
import type { VideoCandidate } from "@/agents/types";

/** Agent 2: finds the top 5 interviews of the week for a given scope ('overall' or one of the 6 categories). */
export async function interviewResearcher(scope: CategorySlug): Promise<VideoCandidate[]> {
  return searchTopFive("interview", scope);
}
