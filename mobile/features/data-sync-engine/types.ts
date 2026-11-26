export type SyncOpAction =
  | "SET_STATUS"
  | "ADD_ITEM"
  | "EDIT_ITEM"
  | "REMOVE_ITEM"
  | "ARCHIVE_LIST";

export type SyncOpState = "PENDING" | "SYNCING" | "FAILED";

export type SyncOperation = {
  id: string;
  queueVersion: 1;
  listId: string;
  itemId?: string;
  action: SyncOpAction;
  payload: Record<string, unknown>;
  createdAt: string;
  /**
   * Enqueue order on this device, set by SyncQueue. Unlike createdAt it does
   * not tie within a millisecond or jump when the clock is corrected.
   * Missing on ops saved by builds before 1.0.9.
   */
  seq?: number;
  /**
   * Lower runs first. Stored for queue format v1 only: replay order comes
   * from {@link ACTION_PRIORITY} via `compareReplayOrder`.
   */
  priority: number;
  state: SyncOpState;
};

export type DataSyncEvent =
  | "queueChanged"
  | "syncStarted"
  | "syncFinished";

export type DataSyncEventHandler = (payload?: {
  listId?: string;
  pendingCount?: number;
  syncedCount?: number;
  error?: string;
}) => void;

/**
 * Item ops share one priority so they replay in the order the user made them
 * (a tick on an item added offline must follow its ADD_ITEM). ARCHIVE_LIST
 * finishes the trip and always runs after everything else on the list.
 */
export const ACTION_PRIORITY: Record<SyncOpAction, number> = {
  SET_STATUS: 10,
  ADD_ITEM: 10,
  EDIT_ITEM: 10,
  REMOVE_ITEM: 10,
  ARCHIVE_LIST: 100,
};
