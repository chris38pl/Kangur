/**
 * History-merge analytics (create from previous lists).
 * Backend ownership — emit via Analytics wrapper only.
 */

import { Analytics } from "@/lib/analytics";

export function historyMergeStarted(workspaceId: string): void {
  Analytics.track(
    "history_merge_started",
    { workspace_id: workspaceId },
    workspaceId,
  );
}

export function historyMergeReviewed(input: {
  workspaceId: string;
  runId: string;
}): void {
  Analytics.track(
    "history_merge_reviewed",
    { workspace_id: input.workspaceId, run_id: input.runId },
    input.workspaceId,
  );
}

export function historyMergeApplied(input: {
  workspaceId: string;
  runId: string;
  listId: string;
}): void {
  Analytics.track(
    "history_merge_applied",
    {
      workspace_id: input.workspaceId,
      run_id: input.runId,
      list_id: input.listId,
    },
    input.workspaceId,
  );
}

export function historyMergeCancelled(input: {
  workspaceId: string;
  runId: string;
}): void {
  Analytics.track(
    "history_merge_cancelled",
    { workspace_id: input.workspaceId, run_id: input.runId },
    input.workspaceId,
  );
}
