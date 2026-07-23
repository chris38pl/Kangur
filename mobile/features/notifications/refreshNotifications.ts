import type { QueryClient } from "@tanstack/react-query";

import { NOTIFICATIONS_QUERY_KEY } from "./useNotifications";

/**
 * Idempotent notification inbox refresh.
 * Safe to call from push / AppState / pull / future websocket.
 * Concurrent calls share one in-flight Promise (dedupe).
 * Offline / network failure → silent no-op (no error logs).
 */
let inFlight: Promise<void> | null = null;

export function refreshNotifications(queryClient: QueryClient): Promise<void> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      await queryClient.refetchQueries({
        queryKey: NOTIFICATIONS_QUERY_KEY,
      });
    } catch {
      // Offline / transient network — normal; never surface as error.
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
