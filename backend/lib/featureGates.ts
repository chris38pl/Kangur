/**
 * Feature gates - single helpers so call-sites stay stable when
 * env → premium → rollout → beta logic evolves.
 */

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
  const raw = process.env.HISTORY_SUGGESTIONS_ENABLED?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") {
    return false;
  }
  // Default on when unset - ship ready; flip off via env for kill-switch.
  return true;
}
