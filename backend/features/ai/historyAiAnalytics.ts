/**
 * AI Generate from History analytics (M13 / M13.11).
 * Backend ownership — emit via Analytics wrapper only.
 */

import { Analytics } from "@/lib/analytics";

export function historyAiGenerateStarted(workspaceId: string): void {
  Analytics.track(
    "history_ai_generate_started",
    { workspace_id: workspaceId },
    workspaceId,
  );
}

export function historyAiGenerateReviewed(input: {
  workspaceId: string;
  runId: string;
}): void {
  Analytics.track(
    "history_ai_generate_reviewed",
    { workspace_id: input.workspaceId, run_id: input.runId },
    input.workspaceId,
  );
}

export function historyAiGenerateApplied(input: {
  workspaceId: string;
  runId: string;
  listId: string;
}): void {
  Analytics.track(
    "history_ai_generate_applied",
    {
      workspace_id: input.workspaceId,
      run_id: input.runId,
      list_id: input.listId,
    },
    input.workspaceId,
  );
}

export function historyAiGenerateCancelled(input: {
  workspaceId: string;
  runId: string;
}): void {
  Analytics.track(
    "history_ai_generate_cancelled",
    { workspace_id: input.workspaceId, run_id: input.runId },
    input.workspaceId,
  );
}
