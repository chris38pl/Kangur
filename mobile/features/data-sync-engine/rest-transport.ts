import { finishShoppingSession } from "@/features/notifications/api";
import {
  createShoppingItem,
  listShoppingItems,
  updateShoppingItem,
} from "@/features/shopping-item/api";
import { finishShoppingList } from "@/features/shopping-list/api";
import type { SyncTransport } from "@/features/data-sync-engine/worker";
import type {
  ItemStatus,
  ShoppingCategory,
  ShoppingItem,
} from "@/features/shopping-item/schemas";
import { ApiClientError } from "@/lib/api/client";
import { createClientId, isLegacyLocalItemId, isUuid } from "@/lib/createClientId";

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

/**
 * A retried ADD_ITEM whose first response was lost gets 409 (clientId is
 * unique). The item is on the server already: use it.
 */
async function findCreatedItem(
  token: string,
  listId: string,
  clientId: string,
): Promise<ShoppingItem | null> {
  const items = await listShoppingItems(token, listId);
  return items.find((item) => item.clientId === clientId) ?? null;
}

/**
 * REST transport for Data Sync Engine (sequential today; batch later).
 * Returns canonical server ShoppingItem when the API provides one.
 */
export function createRestSyncTransport(
  getToken: () => Promise<string | null>,
): SyncTransport {
  return {
    async execute(op): Promise<ShoppingItem | null> {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");

      try {
        let item: ShoppingItem | null = null;

        switch (op.action) {
          case "SET_STATUS": {
            if (!op.itemId) throw new Error("SET_STATUS requires itemId");
            if (isLegacyLocalItemId(op.itemId)) {
              throw new Error(
                `SET_STATUS itemId is a local optimistic id: ${op.itemId}`,
              );
            }
            item = await updateShoppingItem(token, op.itemId, {
              status: op.payload.status as ItemStatus,
            });
            break;
          }
          case "ADD_ITEM": {
            const raw = String(op.payload.clientId ?? op.itemId ?? "");
            const clientId = isUuid(raw) ? raw : createClientId();
            try {
              item = await createShoppingItem(token, op.listId, {
                clientId,
                name: String(op.payload.name ?? ""),
                amount:
                  typeof op.payload.amount === "string"
                    ? op.payload.amount
                    : undefined,
                note:
                  typeof op.payload.note === "string"
                    ? op.payload.note
                    : undefined,
                category: op.payload.category as ShoppingCategory,
              });
            } catch (error) {
              const created =
                error instanceof ApiClientError && error.status === 409
                  ? await findCreatedItem(token, op.listId, clientId)
                  : null;
              if (!created) throw error;
              item = created;
            }
            break;
          }
          case "EDIT_ITEM": {
            if (!op.itemId) throw new Error("EDIT_ITEM requires itemId");
            item = await updateShoppingItem(token, op.itemId, {
              name:
                typeof op.payload.name === "string"
                  ? op.payload.name
                  : undefined,
              amount:
                op.payload.amount === null
                  ? null
                  : typeof op.payload.amount === "string"
                    ? op.payload.amount
                    : undefined,
              note:
                op.payload.note === null
                  ? null
                  : typeof op.payload.note === "string"
                    ? op.payload.note
                    : undefined,
              category: op.payload.category as ShoppingCategory | undefined,
              status: op.payload.status as ItemStatus | undefined,
            });
            break;
          }
          case "REMOVE_ITEM": {
            if (!op.itemId) throw new Error("REMOVE_ITEM requires itemId");
            item = await updateShoppingItem(token, op.itemId, {
              status: "removed",
            });
            break;
          }
          case "ARCHIVE_LIST": {
            // Finishing a trip moves the list to History. Never DELETE here:
            // that is the user's "Delete list" and hides it from History too.
            const sessionId =
              typeof op.payload.serverSessionId === "string" &&
              op.payload.serverSessionId.length > 0
                ? op.payload.serverSessionId
                : null;
            const unavailableCount = toCount(op.payload.unavailableCount);
            let finishedBySession = false;
            if (sessionId) {
              try {
                await finishShoppingSession(
                  token,
                  op.listId,
                  sessionId,
                  unavailableCount,
                );
                finishedBySession = true;
              } catch (error) {
                // Session unknown or list already archived: finish by list,
                // which also answers "already finished".
                if (!(error instanceof ApiClientError && error.status === 404)) {
                  throw error;
                }
              }
            }
            if (!finishedBySession) {
              // Trip started offline, or queued by an older build.
              await finishShoppingList(token, op.listId, unavailableCount);
            }
            item = null;
            break;
          }
          default:
            item = null;
            break;
        }

        const { DataSyncEngine } = await import("./engine");
        DataSyncEngine.connectivity.setOnline(true);
        return item;
      } catch (error) {
        if (
          error instanceof ApiClientError &&
          error.code === "NETWORK_ERROR"
        ) {
          const { DataSyncEngine } = await import("./engine");
          DataSyncEngine.connectivity.setOnline(false);
        }
        throw error;
      }
    },
  };
}
