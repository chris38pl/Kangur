import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { DataSyncEngine } from "@/features/data-sync-engine";
import { createRestSyncTransport } from "@/features/data-sync-engine/rest-transport";
import { ReactQuerySyncCacheAdapter } from "@/features/data-sync-engine/sync-cache-adapter";

/**
 * Architecture rule:
 *
 * Shopping item cache MUST be mutated only by:
 * - optimistic UI writes
 * - SyncCacheAdapter after transport results (success path)
 *
 * Never invalidate or mutate shopping-items here.
 * Cache reconciliation is owned exclusively by SyncCacheAdapter.
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
