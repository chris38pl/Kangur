import type { QueryClient } from "@tanstack/react-query";

import type { ShoppingItem } from "@/features/shopping-item/schemas";

import type { SyncOperation } from "./types";

export type SyncOperationResult =
  | { status: "success"; item?: ShoppingItem }
  | { status: "failed"; error: unknown; httpStatus?: number };
// later: conflict | skipped | cancelled | noop

/**
 * Adapter between DataSyncEngine and app cache.
 * Not a source of truth — only applies transport results.
 */
export interface SyncCacheAdapter {
  applyOperationResult(
    operation: SyncOperation,
    result: SyncOperationResult,
  ): void;
}

/**
 * Conflict resolution: server wins only when strictly newer than cache.
 * Equal timestamps keep the local (optimistic) row.
 */
export function resolveServerUpdate(
  cache: ShoppingItem | undefined,
  server: ShoppingItem,
): ShoppingItem {
  const serverTs = Date.parse(server.updatedAt);
  const cacheTs = cache ? Date.parse(cache.updatedAt) : NaN;
  if (!Number.isFinite(serverTs)) return cache ?? server;
  if (!cache || !Number.isFinite(cacheTs) || serverTs > cacheTs) {
    return { ...cache, ...server };
  }
  return cache;
}

function shoppingItemsKey(listId: string) {
  return ["shopping-items", listId] as const;
}

/**
 * React Query implementation of SyncCacheAdapter.
 * Mutates only the active shopping-items list cache — never history,
 * undo queues, or archived-list screens.
 */
export class ReactQuerySyncCacheAdapter implements SyncCacheAdapter {
  constructor(private readonly queryClient: QueryClient) {}

  applyOperationResult(
    operation: SyncOperation,
    result: SyncOperationResult,
  ): void {
    if (result.status === "failed") {
      // Leave optimistic UI; Engine marks op FAILED for retry.
      return;
    }

    switch (operation.action) {
      case "SET_STATUS":
      case "EDIT_ITEM": {
        if (!result.item) return;
        this.reconcileItem(operation.listId, result.item);
        return;
      }
      case "ADD_ITEM": {
        if (!result.item) return;
        const clientId = String(
          operation.payload.clientId ?? operation.itemId ?? "",
        );
        this.replaceOptimisticItem(operation.listId, clientId, result.item);
        return;
      }
      case "REMOVE_ITEM": {
        const itemId = operation.itemId;
        if (!itemId) return;
        this.removeActiveItem(operation.listId, itemId);
        return;
      }
      case "ARCHIVE_LIST":
        // No-op on active shopping-items cache.
        return;
      default:
        return;
    }
  }

  private reconcileItem(listId: string, server: ShoppingItem): void {
    this.queryClient.setQueryData<ShoppingItem[]>(
      shoppingItemsKey(listId),
      (prev) => {
        if (!prev) return [server];
        let found = false;
        const next = prev.map((item) => {
          if (item.id !== server.id && item.clientId !== server.clientId) {
            return item;
          }
          found = true;
          return resolveServerUpdate(item, server);
        });
        return found ? next : [...next, server];
      },
    );
  }

  /**
   * Replace optimistic row (matched by clientId or temporary id) with
   * canonical server item — never append a duplicate.
   */
  private replaceOptimisticItem(
    listId: string,
    clientId: string,
    server: ShoppingItem,
  ): void {
    this.queryClient.setQueryData<ShoppingItem[]>(
      shoppingItemsKey(listId),
      (prev) => {
        if (!prev) return [server];
        const idx = prev.findIndex(
          (item) =>
            item.clientId === clientId ||
            item.id === clientId ||
            (server.clientId != null && item.clientId === server.clientId),
        );
        if (idx < 0) {
          // No optimistic row — still avoid dup by server id.
          if (prev.some((item) => item.id === server.id)) {
            return prev.map((item) =>
              item.id === server.id ? resolveServerUpdate(item, server) : item,
            );
          }
          return [...prev, server];
        }
        const next = [...prev];
        next[idx] = resolveServerUpdate(prev[idx], server);
        // Drop any other row that already has the server id.
        return next.filter(
          (item, i) => i === idx || item.id !== server.id,
        );
      },
    );
  }

  /**
   * Remove from ACTIVE shopping-items cache only.
   * Never mutate: shopping history, undo queue, archived lists.
   */
  private removeActiveItem(listId: string, itemId: string): void {
    this.queryClient.setQueryData<ShoppingItem[]>(
      shoppingItemsKey(listId),
      (prev) => prev?.filter((item) => item.id !== itemId) ?? prev,
    );
  }
}
