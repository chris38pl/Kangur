/**
 * Feature gates - single helpers so call-sites stay stable when
 * env → premium → rollout → beta logic evolves.
 */

import { FeatureFlags, isFeatureEnabled } from "@/lib/featureFlags";

type WorkspaceGateInput = {
  id: string;
};

export function isHistorySuggestionsEnabled(
  _workspace: WorkspaceGateInput,
): boolean {
  return isFeatureEnabled(FeatureFlags.historySuggestions, true);
}

/** Meal proposal → shopping list (M21). Default on; kill via MEAL_PROPOSAL_ENABLED=0. */
export function isMealProposalEnabled(
  _workspace: WorkspaceGateInput,
): boolean {
  return isFeatureEnabled(FeatureFlags.mealProposal, true);
}
