import type { QueryClient } from "@tanstack/react-query";

import { DataSyncEngine } from "@/features/data-sync-engine";
import { MetricNames } from "@shared/metrics/names";
import { getMetrics } from "@/lib/metrics";

const DEBOUNCE_MS = 250;
const MAX_WAIT_MS = 2_500;
const POLL_IDLE_MS = 100;

type RefreshState = {
  debounceTimer: ReturnType<typeof setTimeout> | null;
  deferTimer: ReturnType<typeof setTimeout> | null;
  waitingListId: string | null;
};

const state: RefreshState = {
  debounceTimer: null,
  deferTimer: null,
  waitingListId: null,
};

function clearDebounce() {
  if (state.debounceTimer) {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = null;
  }
}

function clearDefer() {
  if (state.deferTimer) {
    clearTimeout(state.deferTimer);
    state.deferTimer = null;
  }
}

async function listBusy(listId: string): Promise<boolean> {
  const pending = await DataSyncEngine.pendingCount(listId);
  return pending > 0;
}

function runInvalidate(queryClient: QueryClient, listId: string) {
  clearDebounce();
  state.debounceTimer = setTimeout(() => {
    state.debounceTimer = null;
    getMetrics().increment(MetricNames.realtimeRefreshRequests);
    void queryClient.invalidateQueries({
      queryKey: ["shopping-items", listId],
    });
  }, DEBOUNCE_MS);
}

/**
 * Request a canonical items refresh (debounce + defer while local sync pending).
 * Never driven by toast — only by event detection / explicit callers.
 */
export function scheduleItemsRefresh(
  queryClient: QueryClient,
  listId: string,
): void {
  clearDefer();
  state.waitingListId = listId;

  const startedAt = Date.now();

  const attempt = async () => {
    if (state.waitingListId !== listId) return;

    const busy = await listBusy(listId);
    if (!busy) {
      state.waitingListId = null;
      runInvalidate(queryClient, listId);
      return;
    }

    getMetrics().increment(MetricNames.realtimeRefreshDeferred);

    if (Date.now() - startedAt >= MAX_WAIT_MS) {
      state.waitingListId = null;
      if (!DataSyncEngine.isOnline()) {
        clearDebounce();
        getMetrics().increment(MetricNames.realtimeRefreshCancelledOffline);
        return;
      }
      runInvalidate(queryClient, listId);
      return;
    }

    state.deferTimer = setTimeout(() => {
      state.deferTimer = null;
      void attempt();
    }, POLL_IDLE_MS);
  };

  void attempt();
}

export function cancelItemsRefresh(): void {
  clearDebounce();
  clearDefer();
  state.waitingListId = null;
}
