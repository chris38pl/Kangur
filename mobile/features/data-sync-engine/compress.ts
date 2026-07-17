import type { SyncOperation } from "./types";

/**
 * Compress before flush:
 * - consecutive SET_STATUS / EDIT_ITEM on same item → last wins
 * - ADD_ITEM then REMOVE_ITEM (same item) → drop both
 * - EDIT_ITEM then REMOVE_ITEM → keep REMOVE only
 */
export function compressOperations(ops: SyncOperation[]): {
  compressed: SyncOperation[];
  ratio: number;
} {
  const sorted = [...ops].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
  });

  const result: SyncOperation[] = [];
  const byItemLastIndex = new Map<string, number>();

  for (const op of sorted) {
    const itemKey = op.itemId ?? `__list_${op.listId}_${op.action}`;

    if (op.action === "REMOVE_ITEM" && op.itemId) {
      // Drop earlier ADD for same item
      const addIdx = result.findIndex(
        (r) =>
          r.action === "ADD_ITEM" &&
          r.itemId === op.itemId &&
          r.listId === op.listId,
      );
      if (addIdx >= 0) {
        result.splice(addIdx, 1);
        // rebuild indices roughly
        byItemLastIndex.clear();
        result.forEach((r, i) => {
          if (r.itemId) byItemLastIndex.set(`${r.listId}:${r.itemId}:${r.action}`, i);
        });
        continue; // ADD+REMOVE cancel
      }

      // Drop earlier EDIT for same item
      for (let i = result.length - 1; i >= 0; i--) {
        const r = result[i];
        if (
          r.itemId === op.itemId &&
          r.listId === op.listId &&
          r.action === "EDIT_ITEM"
        ) {
          result.splice(i, 1);
        }
      }
      result.push(op);
      continue;
    }

    if (
      (op.action === "SET_STATUS" || op.action === "EDIT_ITEM") &&
      op.itemId
    ) {
      const key = `${op.listId}:${op.itemId}:${op.action}`;
      const prev = byItemLastIndex.get(key);
      if (prev !== undefined && result[prev]) {
        result[prev] = op;
        continue;
      }
      byItemLastIndex.set(key, result.length);
      result.push(op);
      continue;
    }

    result.push(op);
  }

  const before = ops.length || 1;
  return {
    compressed: result,
    ratio: result.length / before,
  };
}
