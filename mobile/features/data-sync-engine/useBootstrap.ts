import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { DataSyncEngine } from "@/features/data-sync-engine";
import { createRestSyncTransport } from "@/features/data-sync-engine/rest-transport";

/** Bootstraps Data Sync Engine once with REST transport. */
export function useDataSyncEngineBootstrap() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    DataSyncEngine.start(createRestSyncTransport(() => getToken()));
  }, [getToken]);

  useEffect(() => {
    return DataSyncEngine.on("syncFinished", (payload) => {
      // Only refresh after successful ops — failed sync must not wipe optimistic UI.
      if ((payload?.syncedCount ?? 0) <= 0) return;

      const listId = payload?.listId;
      if (listId) {
        void queryClient.invalidateQueries({
          queryKey: ["shopping-items", listId],
        });
        void queryClient.invalidateQueries({
          queryKey: ["shopping-list", listId],
        });
      } else {
        void queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      }
      void queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
    });
  }, [queryClient]);
}
