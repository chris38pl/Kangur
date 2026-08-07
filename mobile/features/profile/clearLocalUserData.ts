import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QueryClient } from "@tanstack/react-query";

import { PREFERRED_LOCALE_STORAGE_KEY } from "@/lib/i18n/preferred-locale-storage";

const QUEUE_KEY = "kangur.dataSync.queue.v1";
const SESSION_PREFIX = "kangur.shoppingSession.v1.";
const CURSOR_PREFIX = "realtime:cursor:";

/**
 * Idempotent local wipe on sign-out, account switch, or account deletion.
 *
 * Clears:
 * - React Query cache (`queryClient.clear()`)
 * - AsyncStorage offline queue (DataSyncEngine)
 * - Cached shopping session snapshots / warm boot (`kangur.perf.cache.*`)
 * - Active + admin-browsing workspace ids
 * - Realtime polling cursors
 * - Any other `kangur.*` / `realtime:*` keys found
 *
 * Keeps:
 * - Preferred UI locale (`kangur.preferredLocale`) so language survives logout
 *
 * Missing keys are OK (no throw). Clerk token cache is cleared via `signOut()` —
 * call this helper **before** `signOut()`, not instead of it.
 */
export async function clearLocalUserData(
  queryClient: QueryClient,
): Promise<void> {
  queryClient.clear();

  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter(
      (key) =>
        key !== PREFERRED_LOCALE_STORAGE_KEY &&
        (key === QUEUE_KEY ||
          key.startsWith(SESSION_PREFIX) ||
          key.startsWith(CURSOR_PREFIX) ||
          key.startsWith("kangur.") ||
          key.startsWith("realtime:")),
    );
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }
  } catch {
    // Idempotent best-effort - never block sign-out path on storage errors.
  }
}
