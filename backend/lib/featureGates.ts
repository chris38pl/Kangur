/**
 * Feature gates - single helpers so call-sites stay stable when
 * env → premium → rollout → beta logic evolves.
 */

import { FeatureFlags, isFeatureEnabled } from "@/lib/featureFlags";

type WorkspaceGateInput = {
  id: string;
};

/**
 * History → AI shopping list suggestions.
 * Backend is source of truth; mobile may hide FAB for UX only.
 */
export function isHistorySuggestionsEnabled(
  _workspace: WorkspaceGateInput,
): boolean {
  return isFeatureEnabled(FeatureFlags.historySuggestions, true);
}
