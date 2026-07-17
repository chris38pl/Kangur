import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useRef } from "react";

import { DataSyncEngine } from "@/features/data-sync-engine";
import { createRestSyncTransport } from "@/features/data-sync-engine/rest-transport";

/** Bootstraps Data Sync Engine once with REST transport. */
export function useDataSyncEngineBootstrap() {
  const { getToken } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    DataSyncEngine.start(createRestSyncTransport(() => getToken()));
  }, [getToken]);
}
