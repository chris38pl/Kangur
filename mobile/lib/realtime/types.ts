/**
 * ADR - EventPollingProvider
 *
 * EventPollingProvider never interprets event payloads as the source of truth
 * for the shopping list. Events are only a signal to refresh canonical state
 * from the API (invalidate → GET items).
 *
 * EventPollingProvider owns polling lifecycle only. React Query cache ownership
 * remains in SyncCacheAdapter + React Query.
 *
 * Future: swap this transport for WebSocketTransport without changing
 * useListRealtime(). Server push should cover the active list only.
 * Future: ETag / If-None-Match / 304 on GET …/events.
 */

import type { ShoppingEvent } from "@/features/shopping-item/schemas";

export type EventPage = {
  events: ShoppingEvent[];
  nextCursor: string | null;
};

export type EventCursor = {
  lastEventId: string;
  lastUpdatedAt: string;
};

export type FetchEventsPage = (
  listId: string,
  after: string | null,
) => Promise<EventPage>;

/**
 * Stable public contract for the polling transport.
 * Internal flags / phase models are free as long as this behavior holds.
 */
export interface EventPollingProvider {
  start(listId: string): void;
  stop(): void;
  pollNow(): void;
  isRunning(): boolean;
  getCurrentListId(): string | null;
  /** Optional full cleanup (logout / teardown). App-lifetime singleton may omit. */
  destroy?(): void;
}

export type EventBatchMeta = {
  listId: string;
  /** True while seeding cursor - no toast / no items refresh. */
  bootstrap: boolean;
};

export type EventPollingCallbacks = {
  fetchPage: FetchEventsPage;
  isOnline: () => boolean;
  onBatch: (events: ShoppingEvent[], meta: EventBatchMeta) => void;
  onError?: (error: unknown) => void;
};
