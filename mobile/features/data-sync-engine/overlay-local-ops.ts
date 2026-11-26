import type {
  ItemStatus,
  ShoppingCategory,
  ShoppingItem,
} from "../shopping-item/schemas";

import { isQueuedAfter } from "./replay";
import type { SyncOperation } from "./types";

const OUTBOUND_STATES = new Set(["PENDING", "SYNCING", "FAILED"]);

function isOutbound(op: SyncOperation): boolean {
  return OUTBOUND_STATES.has(op.state);
}

function isItemStatus(value: unknown): value is ItemStatus {
  return (
    value === "pending" ||
    value === "bought" ||
    value === "unavailable" ||
    value === "removed"
  );
}

const isNewer = isQueuedAfter;

/**
 * Last local operation wins: for each item, the newest outbound SET_STATUS
 * (enqueue order, see isQueuedAfter) is the intended status until the backend
 * confirms. An op can name the item by server id or, for an item added
 * offline, by its clientId.
 */
export function overlayLocalOutboundStatuses(
  serverItems: ShoppingItem[],
  outboundOps: readonly SyncOperation[],
): ShoppingItem[] {
  const newestByItemId = new Map<string, SyncOperation>();

  for (const op of outboundOps) {
    if (
      op.action !== "SET_STATUS" ||
      !isOutbound(op) ||
      typeof op.itemId !== "string" ||
      op.itemId.length === 0 ||
      !isItemStatus(op.payload.status)
    ) {
      continue;
    }
    const current = newestByItemId.get(op.itemId);
    if (!current || isNewer(op, current)) newestByItemId.set(op.itemId, op);
  }

  if (newestByItemId.size === 0) return [...serverItems];

  return serverItems.map((item) => {
    const byId = newestByItemId.get(item.id);
    const byClientId = item.clientId
      ? newestByItemId.get(item.clientId)
      : undefined;
    const op =
      byId && byClientId
        ? isNewer(byClientId, byId)
          ? byClientId
          : byId
        : (byId ?? byClientId);
    const localStatus = op?.payload.status as ItemStatus | undefined;
    if (!localStatus || localStatus === item.status) return item;
    return { ...item, status: localStatus };
  });
}

/**
 * Items added on this device whose ADD_ITEM is still queued are not on the
 * server yet. Keep them on the list (same row the add sheet writes) so a
 * refetch before the replay does not make them disappear.
 */
export function withPendingAdds(
  serverItems: ShoppingItem[],
  outboundOps: readonly SyncOperation[],
): ShoppingItem[] {
  const known = new Set<string>();
  for (const item of serverItems) {
    known.add(item.id);
    if (item.clientId) known.add(item.clientId);
  }

  const pending: ShoppingItem[] = [];
  for (const op of outboundOps) {
    if (op.action !== "ADD_ITEM" || !isOutbound(op)) continue;
    const clientId = String(op.payload.clientId ?? op.itemId ?? "");
    if (!clientId || known.has(clientId)) continue;
    known.add(clientId);
    const name = String(op.payload.name ?? "");
    pending.push({
      id: clientId,
      clientId,
      listId: op.listId,
      name,
      normalizedName: name.toLowerCase(),
      amount: typeof op.payload.amount === "string" ? op.payload.amount : null,
      note: typeof op.payload.note === "string" ? op.payload.note : null,
      category: op.payload.category as ShoppingCategory,
      status: "pending",
      sortOrder: 9999,
      addedByUserId: "",
      updatedByUserId: "",
      createdAt: op.createdAt,
      updatedAt: op.createdAt,
    });
  }

  return pending.length === 0 ? serverItems : [...serverItems, ...pending];
}

/** GET reconcile: server rows, plus queued adds, with local statuses on top. */
export function reconcileWithOutbound(
  serverItems: ShoppingItem[],
  outboundOps: readonly SyncOperation[],
): ShoppingItem[] {
  return overlayLocalOutboundStatuses(
    withPendingAdds(serverItems, outboundOps),
    outboundOps,
  );
}

/**
 * Apply outbound SET_STATUS overlay to a single transport success payload.
 * Prevents an older in-flight SET_STATUS response from reverting newer optimistic UI.
 */
export function materializeSuccessfulItem(
  serverItem: ShoppingItem,
  outboundOps: readonly SyncOperation[],
): ShoppingItem {
  const [overlaid] = overlayLocalOutboundStatuses([serverItem], outboundOps);
  return overlaid ?? serverItem;
}
