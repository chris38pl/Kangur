import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { DataSyncEngine } from "@/features/data-sync-engine";
import { createRestSyncTransport } from "@/features/data-sync-engine/rest-transport";
import { ReactQuerySyncCacheAdapter } from "@/features/data-sync-engine/sync-cache-adapter";

/**
 * Architecture rule (shopping-items SSoT):
 *
 * Writers:
 * 1. Optimistic UI + DataSyncEngine.enqueue (outbound)
 * 2. SyncCacheAdapter.applyOperationResult after transport success
 * 3. SyncCacheAdapter.reconcileServerSnapshot after GET / refresh (inbound)
 *
 * Realtime / EventPolling never calls queryClient directly — only
 * DataSyncEngine.requestItemsRefresh (hint). Engine decides wait / invalidate.
 *
 * Never blind-replace shopping-items with a raw server list while outbound
 * ops exist; reconcile uses last local operation wins per itemId.
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
