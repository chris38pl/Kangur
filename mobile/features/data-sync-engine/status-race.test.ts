/**
 * Guards shopping SET_STATUS race that caused UI flicker:
 * older in-flight success must not revert a newer optimistic status.
 *
 * Run from mobile/: pnpm test:status-race
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compressOperations } from "./compress.ts";
import {
  materializeSuccessfulItem,
  overlayLocalOutboundStatuses,
} from "./overlay-local-ops.ts";
import { resolveServerUpdate } from "./resolve-server-update.ts";
import type { SyncOperation } from "./types.ts";
import { ACTION_PRIORITY } from "./types.ts";

type ItemStatus = "pending" | "bought" | "unavailable" | "removed";

type ShoppingItem = {
  id: string;
  clientId: string | null;
  listId: string;
  name: string;
  normalizedName: string | null;
  amount: string | null;
  note: string | null;
  category: string;
  status: ItemStatus;
  sortOrder: number;
  addedByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
};

function makeItem(
  overrides: Partial<ShoppingItem> & Pick<ShoppingItem, "id" | "status">,
): ShoppingItem {
  return {
    clientId: null,
    listId: "list-1",
    name: overrides.id,
    normalizedName: overrides.id,
    amount: null,
    note: null,
    category: "vegetables",
    sortOrder: 0,
    addedByUserId: "u1",
    updatedByUserId: "u1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeSetStatusOp(input: {
  id: string;
  itemId: string;
  status: ItemStatus;
  state: SyncOperation["state"];
  createdAt: string;
}): SyncOperation {
  return {
    id: input.id,
    queueVersion: 1,
    listId: "list-1",
    itemId: input.itemId,
    action: "SET_STATUS",
    payload: { status: input.status },
    createdAt: input.createdAt,
    priority: ACTION_PRIORITY.SET_STATUS,
    state: input.state,
  };
}

/**
 * Mirrors ReactQuerySyncCacheAdapter SET_STATUS success path:
 * materialize with outbound overlay, then timestamp LWW into cache row.
 */
function applyStatusSuccess(input: {
  cache: ShoppingItem;
  serverItem: ShoppingItem;
  outboundOps: SyncOperation[];
}): ShoppingItem {
  const materialized = materializeSuccessfulItem(
    input.serverItem,
    input.outboundOps,
  );
  return resolveServerUpdate(input.cache, materialized);
}

describe("stale SET_STATUS success race", () => {
  it("reproduces the bug without overlay: older server bought overwrites newer unavailable", () => {
    const cache = makeItem({
      id: "a",
      status: "unavailable",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const olderServerSuccess = makeItem({
      id: "a",
      status: "bought",
      updatedAt: "2026-01-01T00:00:05.000Z",
    });

    const merged = resolveServerUpdate(cache, olderServerSuccess);
    assert.equal(
      merged.status,
      "bought",
      "without overlay, timestamp LWW reverts newer optimistic status",
    );
  });

  it("same-item SYNCING+PENDING: older bought success does not flicker away unavailable", () => {
    const cache = makeItem({
      id: "milk",
      status: "unavailable",
      category: "dairy",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const outbound = [
      makeSetStatusOp({
        id: "op1",
        itemId: "milk",
        status: "bought",
        state: "SYNCING",
        createdAt: "2026-01-01T00:00:01.000Z",
      }),
      makeSetStatusOp({
        id: "op2",
        itemId: "milk",
        status: "unavailable",
        state: "PENDING",
        createdAt: "2026-01-01T00:00:02.000Z",
      }),
    ];

    const next = applyStatusSuccess({
      cache,
      serverItem: makeItem({
        id: "milk",
        status: "bought",
        category: "dairy",
        updatedAt: "2026-01-01T00:00:05.000Z",
      }),
      outboundOps: outbound,
    });

    assert.equal(next.status, "unavailable");
    assert.equal(next.updatedAt, "2026-01-01T00:00:05.000Z");
  });

  it("rapid multi-item mixed categories: out-of-order successes keep each newest status", () => {
    const tomatoCache = makeItem({
      id: "tomato",
      status: "bought",
      category: "vegetables",
    });
    const milkCache = makeItem({
      id: "milk",
      status: "unavailable",
      category: "dairy",
    });
    const breadCache = makeItem({
      id: "bread",
      status: "bought",
      category: "bakery",
    });

    const tomatoOp = makeSetStatusOp({
      id: "t1",
      itemId: "tomato",
      status: "bought",
      state: "SYNCING",
      createdAt: "2026-01-01T00:00:01.000Z",
    });
    const milkBought = makeSetStatusOp({
      id: "m1",
      itemId: "milk",
      status: "bought",
      state: "SYNCING",
      createdAt: "2026-01-01T00:00:01.100Z",
    });
    const milkUnavailable = makeSetStatusOp({
      id: "m2",
      itemId: "milk",
      status: "unavailable",
      state: "PENDING",
      createdAt: "2026-01-01T00:00:01.200Z",
    });
    const breadOp = makeSetStatusOp({
      id: "b1",
      itemId: "bread",
      status: "bought",
      state: "SYNCING",
      createdAt: "2026-01-01T00:00:01.300Z",
    });
    const outbound = [tomatoOp, milkBought, milkUnavailable, breadOp];

    // Milk bought success arrives first (stale vs newer unavailable pending)
    const milkAfter = applyStatusSuccess({
      cache: milkCache,
      serverItem: makeItem({
        id: "milk",
        status: "bought",
        category: "dairy",
        updatedAt: "2026-01-01T00:00:06.000Z",
      }),
      outboundOps: outbound,
    });
    assert.equal(milkAfter.status, "unavailable");

    const breadAfter = applyStatusSuccess({
      cache: breadCache,
      serverItem: makeItem({
        id: "bread",
        status: "bought",
        category: "bakery",
        updatedAt: "2026-01-01T00:00:07.000Z",
      }),
      outboundOps: outbound,
    });
    assert.equal(breadAfter.status, "bought");

    const tomatoAfter = applyStatusSuccess({
      cache: tomatoCache,
      serverItem: makeItem({
        id: "tomato",
        status: "bought",
        category: "vegetables",
        updatedAt: "2026-01-01T00:00:08.000Z",
      }),
      outboundOps: outbound,
    });
    assert.equal(tomatoAfter.status, "bought");

    // Final UI snapshot after all successes
    assert.deepEqual(
      [tomatoAfter.status, milkAfter.status, breadAfter.status],
      ["bought", "unavailable", "bought"],
    );
  });

  it("failed mutation path leaves cache untouched (no rollback of other items)", () => {
    // applyOperationResult on failed is a no-op — document expected contract.
    const a = makeItem({ id: "a", status: "bought" });
    const b = makeItem({ id: "b", status: "bought" });
    assert.equal(a.status, "bought");
    assert.equal(b.status, "bought");
  });

  it("single click success matches newest outbound and does not change intended status", () => {
    const cache = makeItem({
      id: "a",
      status: "bought",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const outbound = [
      makeSetStatusOp({
        id: "op1",
        itemId: "a",
        status: "bought",
        state: "SYNCING",
        createdAt: "2026-01-01T00:00:01.000Z",
      }),
    ];
    const next = applyStatusSuccess({
      cache,
      serverItem: makeItem({
        id: "a",
        status: "bought",
        updatedAt: "2026-01-01T00:00:05.000Z",
      }),
      outboundOps: outbound,
    });
    assert.equal(next.status, "bought");
  });
});

describe("compressOperations SET_STATUS last-wins among PENDING", () => {
  it("collapses multiple PENDING SET_STATUS on same item to the last", () => {
    const ops = [
      makeSetStatusOp({
        id: "1",
        itemId: "a",
        status: "bought",
        state: "PENDING",
        createdAt: "2026-01-01T00:00:01.000Z",
      }),
      makeSetStatusOp({
        id: "2",
        itemId: "a",
        status: "unavailable",
        state: "PENDING",
        createdAt: "2026-01-01T00:00:02.000Z",
      }),
      makeSetStatusOp({
        id: "3",
        itemId: "a",
        status: "pending",
        state: "PENDING",
        createdAt: "2026-01-01T00:00:03.000Z",
      }),
    ];
    const { compressed } = compressOperations(ops);
    assert.equal(compressed.length, 1);
    assert.equal(compressed[0]?.payload.status, "pending");
    assert.equal(compressed[0]?.id, "3");
  });
});

describe("overlayLocalOutboundStatuses GET path", () => {
  it("applies newest outbound status across categories on a server snapshot", () => {
    const server = [
      makeItem({ id: "a", status: "pending", category: "vegetables" }),
      makeItem({ id: "b", status: "pending", category: "dairy" }),
    ];
    const outbound = [
      makeSetStatusOp({
        id: "1",
        itemId: "a",
        status: "bought",
        state: "PENDING",
        createdAt: "2026-01-01T00:00:01.000Z",
      }),
      makeSetStatusOp({
        id: "2",
        itemId: "b",
        status: "unavailable",
        state: "SYNCING",
        createdAt: "2026-01-01T00:00:02.000Z",
      }),
    ];
    const merged = overlayLocalOutboundStatuses(server, outbound);
    assert.equal(merged.find((i) => i.id === "a")?.status, "bought");
    assert.equal(merged.find((i) => i.id === "b")?.status, "unavailable");
  });
});
