import { FeatureFlags, isFeatureEnabled } from "@/lib/featureFlags";

/** History → AI shopping list suggestions (UX gate; backend is SoT). */
export function isHistorySuggestionsEnabled(): boolean {
  return isFeatureEnabled(FeatureFlags.historySuggestions, true);
}

/** Meal proposal → shopping list (M21). */
export function isMealProposalEnabled(): boolean {
  return isFeatureEnabled(FeatureFlags.mealProposal, true);
}
