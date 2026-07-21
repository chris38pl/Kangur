import { DataSyncEngine } from "@/features/data-sync-engine";
import { notifyShoppingFinished } from "@/features/notifications/api";

import { ShoppingSession } from "./shopping-session";

/**
 * Notify workspace that this shopper finished - call only from the actor's
 * "Finish shopping" CTA, never when opening the summary as a viewer.
 */
export async function notifyFinishedForActiveSession(
  listId: string,
  getToken: () => Promise<string | null>,
  unavailableCount: number,
): Promise<void> {
  if (!DataSyncEngine.isOnline()) return;

  const sessionId = ShoppingSession.get(listId)?.serverSessionId;
  if (!sessionId) return;

  const token = await getToken();
  if (!token) return;

  try {
    await notifyShoppingFinished(token, listId, sessionId, unavailableCount);
  } catch (error) {
    console.info("[shopping]", "NotifyFinishedFailed", error);
  }
}
