import {
  createShoppingItem,
  updateShoppingItem,
} from "@/features/shopping-item/api";
import { archiveShoppingList } from "@/features/shopping-list/api";
import type { SyncTransport } from "@/features/data-sync-engine/worker";
import type {
  ItemStatus,
  ShoppingCategory,
} from "@/features/shopping-item/schemas";
import { createClientId, isLegacyLocalItemId, isUuid } from "@/lib/createClientId";

/**
 * REST transport for Data Sync Engine (sequential today; batch later).
 */
export function createRestSyncTransport(
  getToken: () => Promise<string | null>,
): SyncTransport {
  return {
    async execute(op) {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");

      try {
        switch (op.action) {
          case "SET_STATUS": {
            if (!op.itemId) throw new Error("SET_STATUS requires itemId");
            // Server item ids are Prisma cuids — only reject legacy local_* optimistic ids.
            if (isLegacyLocalItemId(op.itemId)) {
              throw new Error(
                `SET_STATUS itemId is a local optimistic id: ${op.itemId}`,
              );
            }
            await updateShoppingItem(token, op.itemId, {
              status: op.payload.status as ItemStatus,
            });
            break;
          }
          case "ADD_ITEM": {
            const raw = String(op.payload.clientId ?? op.itemId ?? "");
            const clientId = isUuid(raw) ? raw : createClientId();
            await createShoppingItem(token, op.listId, {
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
            break;
          }
          case "EDIT_ITEM": {
            if (!op.itemId) throw new Error("EDIT_ITEM requires itemId");
            await updateShoppingItem(token, op.itemId, {
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
            await updateShoppingItem(token, op.itemId, { status: "removed" });
            break;
          }
          case "ARCHIVE_LIST": {
            await archiveShoppingList(token, op.listId);
            break;
          }
          default:
            break;
        }
        const { DataSyncEngine } = await import("./engine");
        DataSyncEngine.connectivity.setOnline(true);
      } catch (error) {
        const { ApiClientError } = await import("@/lib/api/client");
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
