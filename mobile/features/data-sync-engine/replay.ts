import { ACTION_PRIORITY, type SyncOperation } from "./types";

/**
 * Replay order: the order the user acted in, with ARCHIVE_LIST last.
 * Priority comes from the action, not from the stored op, so a queue saved
 * by an older build (SET_STATUS 10, ADD_ITEM 20) replays in the same order.
 * Within a priority, enqueue order (`seq`); ops saved before `seq` existed
 * were queued first and fall back to createdAt.
 */
export function compareReplayOrder(a: SyncOperation, b: SyncOperation): number {
  const byPriority =
    (ACTION_PRIORITY[a.action] ?? 0) - (ACTION_PRIORITY[b.action] ?? 0);
  if (byPriority !== 0) return byPriority;
  const bySeq = (a.seq ?? 0) - (b.seq ?? 0);
  if (bySeq !== 0) return bySeq;
  return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
}

/** True when `a` was queued after `b`. */
export function isQueuedAfter(a: SyncOperation, b: SyncOperation): boolean {
  if (a.seq !== undefined && b.seq !== undefined && a.seq !== b.seq) {
    return a.seq > b.seq;
  }
  return (a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)) > 0;
}

/**
 * An item added offline is queued under its clientId. Once the server has
 * created it, later ops on that item must use the server id instead
 * (PATCH /items/:id only knows server ids).
 */
export function remapItemId(
  ops: readonly SyncOperation[],
  listId: string,
  fromId: string,
  toId: string,
): SyncOperation[] {
  return ops.map((op) =>
    op.listId === listId && op.itemId === fromId && op.action !== "ADD_ITEM"
      ? { ...op, itemId: toId }
      : op,
  );
}

/**
 * HTTP statuses that will not change on retry: the list or item is gone,
 * the request is invalid, or it conflicts with what the server has.
 * Network errors, 401 (token refresh), 408, 429 and 5xx stay retryable.
 */
const PERMANENT_REJECTION_STATUSES = new Set([400, 403, 404, 409, 410, 422]);

export function isPermanentRejection(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: unknown }).status;
  return (
    typeof status === "number" && PERMANENT_REJECTION_STATUSES.has(status)
  );
}
