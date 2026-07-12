import { searchTopFive } from "@/lib/youtube";
import type { CategorySlug } from "@/types/db";
import type { VideoCandidate } from "@/agents/types";

/** Agent 1: finds the top 5 podcasts of the week for a given scope ('overall' or one of the 6 categories). */
export async function podcastResearcher(scope: CategorySlug): Promise<VideoCandidate[]> {
  return searchTopFive("podcast", scope);
}
