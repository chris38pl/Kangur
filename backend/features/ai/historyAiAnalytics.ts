/**
 * No-op product analytics stubs for AI Generate from History (M13).
 * Wire to a real analytics provider later without changing call sites.
 */

export function historyAiGenerateStarted(workspaceId: string): void {
  void workspaceId;
  // future: history_ai_generate_started
}

export function historyAiGenerateReviewed(input: {
  workspaceId: string;
  runId: string;
}): void {
  void input;
  // future: history_ai_generate_reviewed
}

export function historyAiGenerateApplied(input: {
  workspaceId: string;
  runId: string;
  listId: string;
}): void {
  void input;
  // future: history_ai_generate_applied
}

export function historyAiGenerateCancelled(input: {
  workspaceId: string;
  runId: string;
}): void {
  void input;
  // future: history_ai_generate_cancelled
}
