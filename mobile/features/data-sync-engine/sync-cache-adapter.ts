import type { QueryClient } from "@tanstack/react-query";

import {
  shoppingItemsQueryKey,
  shoppingItemsQueryPrefix,
} from "../shopping-item/query-keys";
import type { ShoppingItem } from "../shopping-item/schemas";

import {
  materializeSuccessfulItem,
  overlayLocalOutboundStatuses,
} from "./overlay-local-ops";
import { resolveServerUpdate } from "./resolve-server-update";
import type { SyncOperation } from "./types";

export type SyncOperationResult =
  | { status: "success"; item?: ShoppingItem }
  | { status: "failed"; error: unknown; httpStatus?: number };
// later: conflict | skipped | cancelled | noop

export { resolveServerUpdate } from "./resolve-server-update";

/**
 * Adapter between DataSyncEngine and app cache.
 * Owns materializing GET results and transport success into React Query.
 * Never blind-overwrite shopping-items with a raw server list.
 */
export interface SyncCacheAdapter {
  applyOperationResult(
    operation: SyncOperation,
    result: SyncOperationResult,
    /** Current outbound ops for this list - used to keep newer local SET_STATUS. */
    outboundOps?: readonly SyncOperation[],
  ): void;
  /**
   * Inbound GET path: merge server list with outbound local ops, then write cache.
   * Returns the reconciled list (also set into React Query).
   */
  reconcileServerSnapshot(
    listId: string,
    serverItems: ShoppingItem[],
    outboundOps: SyncOperation[],
  ): ShoppingItem[];
  /** Request React Query to re-run shopping-items queryFn (which reconciles). */
  invalidateShoppingItems(listId: string): void;
}

/** Active-list cache key — must match {@link useShoppingItems} default scope. */
function activeShoppingItemsKey(listId: string) {
  return shoppingItemsQueryKey(listId, "active");
}

/**
 * React Query implementation of SyncCacheAdapter.
 * Mutates only the active shopping-items list cache - never history,
 * undo queues, or archived-list screens.
 */
export class ReactQuerySyncCacheAdapter implements SyncCacheAdapter {
  constructor(private readonly queryClient: QueryClient) {}

  applyOperationResult(
    operation: SyncOperation,
    result: SyncOperationResult,
    outboundOps: readonly SyncOperation[] = [],
  ): void {
    if (result.status === "failed") {
      // Leave optimistic UI; Engine marks op FAILED for retry.
      return;
    }

    switch (operation.action) {
      case "SET_STATUS":
      case "EDIT_ITEM": {
        if (!result.item) return;
        // Overlay keeps a newer PENDING/SYNCING SET_STATUS when this success
        // is from an older in-flight op (rapid taps / swipe then undo).
        const item = materializeSuccessfulItem(result.item, outboundOps);
        this.reconcileItem(operation.listId, item);
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

  reconcileServerSnapshot(
    listId: string,
    serverItems: ShoppingItem[],
    outboundOps: SyncOperation[],
  ): ShoppingItem[] {
    // Return reconciled rows; React Query queryFn (or caller) owns the write.
    void listId;
    return overlayLocalOutboundStatuses(serverItems, outboundOps);
  }

  invalidateShoppingItems(listId: string): void {
    void this.queryClient.invalidateQueries({
      queryKey: shoppingItemsQueryPrefix(listId),
    });
  }

  private reconcileItem(listId: string, server: ShoppingItem): void {
    this.queryClient.setQueryData<ShoppingItem[]>(
      activeShoppingItemsKey(listId),
      (prev) => {
        if (!prev) return [server];
        // Match by server id, or by non-null clientId only.
        // Never treat null/null clientId as a match - that rewrote every
        // item without a clientId into one row (dup keys + false category-done).
        const idx = prev.findIndex(
          (item) =>
            item.id === server.id ||
            (server.clientId != null && item.clientId === server.clientId),
        );
        if (idx < 0) {
          return [...prev, server];
        }
        const next = [...prev];
        next[idx] = resolveServerUpdate(prev[idx], server);
        return next.filter((item, i) => i === idx || item.id !== server.id);
      },
    );
  }

  /**
   * Replace optimistic row (matched by clientId or temporary id) with
   * canonical server item - never append a duplicate.
   */
  private replaceOptimisticItem(
    listId: string,
    clientId: string,
    server: ShoppingItem,
  ): void {
    this.queryClient.setQueryData<ShoppingItem[]>(
      activeShoppingItemsKey(listId),
      (prev) => {
        if (!prev) return [server];
        const idx = prev.findIndex(
          (item) =>
            item.clientId === clientId ||
            item.id === clientId ||
            (server.clientId != null && item.clientId === server.clientId),
        );
        if (idx < 0) {
          // No optimistic row - still avoid dup by server id.
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
      activeShoppingItemsKey(listId),
      (prev) => prev?.filter((item) => item.id !== itemId) ?? prev,
    );
  }
}
