/**
 * Event polling transport (M10).
 *
 * ADR: events are only a signal to refresh canonical list state from the API.
 * EventPollingProvider owns polling lifecycle only — React Query cache ownership
 * remains with SyncCacheAdapter + React Query.
 *
 * Future: WebSocketTransport without changing useListRealtime();
 * server push for the active list only; ETag / 304 on events.
 */

export type { EventPollingProvider, EventCursor, EventPage } from "./types";
export { createEventPollingProvider } from "./EventPollingProvider";
export { useListRealtime } from "./useListRealtime";
export { RemoteChangeToast } from "./remote-change-toast";
export { scheduleItemsRefresh } from "./scheduleItemsRefresh";
