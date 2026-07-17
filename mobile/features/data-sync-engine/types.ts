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
  /** Lower runs first. SET_STATUS early; ARCHIVE_LIST last. */
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
  error?: string;
}) => void;

export const ACTION_PRIORITY: Record<SyncOpAction, number> = {
  SET_STATUS: 10,
  ADD_ITEM: 20,
  EDIT_ITEM: 30,
  REMOVE_ITEM: 40,
  ARCHIVE_LIST: 100,
};
