import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { DataSyncEngine } from "@/features/data-sync-engine";
import { createRestSyncTransport } from "@/features/data-sync-engine/rest-transport";
import { ReactQuerySyncCacheAdapter } from "@/features/data-sync-engine/sync-cache-adapter";

/**
 * Architecture rule (shopping-items SSoT / Local-first Shopping Sync):
 *
 * During an active shopping session the local cache is authoritative for the UI
 * unless a remote change targets an entity with no pending local mutation.
 *
 * Writers:
 * 1. Optimistic UI + DataSyncEngine.enqueue (outbound) — never wait on network
 * 2. SyncCacheAdapter.applyOperationResult after transport success
 * 3. SyncCacheAdapter.reconcileServerSnapshot after GET / refresh (inbound)
 *
 * Realtime / EventPolling never calls queryClient directly — only
 * DataSyncEngine.requestItemsRefresh for **remote** batches (own echoes ignored).
 * Engine also schedules one settled reconcile after outbound queue empties.
 *
 * Never blind-replace shopping-items with a raw server list while outbound
 * ops exist; reconcile uses last local operation wins per pending itemId.
 * Query key: ["shopping-items", listId, "active"|"archived"].
 */
export function useDataSyncEngineBootstrap() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    DataSyncEngine.setSyncCacheAdapter(
      new ReactQuerySyncCacheAdapter(queryClient),
    );
    DataSyncEngine.start(createRestSyncTransport(() => getToken()));
  }, [getToken, queryClient]);
}
