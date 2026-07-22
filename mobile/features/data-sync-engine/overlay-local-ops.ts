import type { ItemStatus, ShoppingItem } from "@/features/shopping-item/schemas";

import type { SyncOperation } from "./types";

const OUTBOUND_STATES = new Set(["PENDING", "SYNCING", "FAILED"]);

/**
 * Last local operation wins: for each itemId, the newest outbound SET_STATUS
 * (by createdAt, then id) is the intended status until the backend confirms.
 */
export function overlayLocalOutboundStatuses(
  serverItems: ShoppingItem[],
  outboundOps: SyncOperation[],
): ShoppingItem[] {
  const statusByItemId = new Map<string, ItemStatus>();

  const setStatusOps = outboundOps
    .filter(
      (op) =>
        op.action === "SET_STATUS" &&
        OUTBOUND_STATES.has(op.state) &&
        typeof op.itemId === "string" &&
        op.itemId.length > 0,
    )
    .slice()
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );

  for (const op of setStatusOps) {
    const status = op.payload.status;
    if (
      status === "pending" ||
      status === "bought" ||
      status === "unavailable" ||
      status === "removed"
    ) {
      statusByItemId.set(op.itemId!, status);
    }
  }

  if (statusByItemId.size === 0) return serverItems;

  return serverItems.map((item) => {
    const localStatus = statusByItemId.get(item.id);
    if (!localStatus || localStatus === item.status) return item;
    return { ...item, status: localStatus };
  });
}
