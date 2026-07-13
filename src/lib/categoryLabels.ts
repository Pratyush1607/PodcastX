import type { CategorySlug } from "@/types/db";

// Kept in a plain (non "use client") module deliberately — importing a constant from a client
// component's file into a Server Component (as ScopePage.tsx and DiscoverHome.tsx do) can
// resolve to undefined in the production bundle even though it works fine in dev, since the
// "use client" boundary can replace the whole module with a client-reference stub server-side.
export const CATEGORY_LABEL_KEYS: Record<CategorySlug, string> = {
  overall: "categoryBar.all",
  tech_ai: "categoryBar.techAi",
  science_education: "categoryBar.scienceEducation",
  sports: "categoryBar.sports",
  health_fitness: "categoryBar.healthFitness",
  comedy: "categoryBar.comedy",
  pop_internet_culture: "categoryBar.popInternetCulture",
};
