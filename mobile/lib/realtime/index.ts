/**
 * Event polling transport (M10).
 *
 * ADR: events are only a signal to refresh canonical list state from the API.
 * EventPollingProvider owns polling lifecycle only. Cache ownership:
 * DataSyncEngine + SyncCacheAdapter + React Query (realtime never writes RQ).
 *
 * Future: WebSocketTransport without changing useListRealtime();
 * server push for the focused/active list only; ETag / 304 on events.
 */

export type { EventPollingProvider, EventCursor, EventPage } from "./types";
export { createEventPollingProvider } from "./EventPollingProvider";
export { useListRealtime } from "./useListRealtime";
export { RemoteChangeToast } from "./remote-change-toast";
export { scheduleItemsRefresh, cancelItemsRefresh } from "./scheduleItemsRefresh";
