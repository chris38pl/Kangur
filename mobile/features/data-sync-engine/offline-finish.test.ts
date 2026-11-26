/**
 * Finishing a shopping trip without signal must not delete the list, and an
 * item added and ticked offline must reach the server as bought once the
 * signal is back.
 *
 * Runs the real ShoppingSession, DataSyncEngine, REST transport and React
 * Query cache adapter against an in-memory fake of the Kangur API that
 * mirrors the backend routes (no network, no database).
 *
 * Run from mobile/: pnpm test:offline-finish
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, describe, it, mock } from "node:test";

import { QueryClient } from "@tanstack/react-query";

import { listShoppingItems } from "../shopping-item/api.ts";
import { shoppingItemsQueryKey } from "../shopping-item/query-keys.ts";
import type {
  ItemStatus,
  ShoppingCategory,
  ShoppingItem,
} from "../shopping-item/schemas.ts";
import { ShoppingSession } from "../shopping-list/session/shopping-session.ts";
import { DataSyncEngine } from "./engine.ts";
import { compareReplayOrder } from "./replay.ts";
import { createRestSyncTransport } from "./rest-transport.ts";
import { ReactQuerySyncCacheAdapter } from "./sync-cache-adapter.ts";
import type { SyncOperation } from "./types.ts";

const API_URL = "http://kangur.test";
const TOKEN = "test-token";
const WORKSPACE_ID = "ws-1";
const ACTOR_ID = "user-1";

// ---------------------------------------------------------------------------
// Fake Kangur API (same status codes and side effects as backend/app/api/v1)
// ---------------------------------------------------------------------------

type ListStatus = "active" | "archived" | "deleted";
type FakeList = { id: string; status: ListStatus };
type FakeSession = { id: string; listId: string; finishedAt: string | null };
type Fault = { method: string; path: string; when: "before" | "after" };

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

class FakeKangurApi {
  online = true;
  readonly lists = new Map<string, FakeList>();
  readonly items = new Map<string, ShoppingItem>();
  readonly sessions = new Map<string, FakeSession>();
  /** Domain events the backend would publish (household notifications). */
  readonly events: string[] = [];
  /** "METHOD /path" for every request that reached the server. */
  readonly requests: string[] = [];
  private faults: Fault[] = [];
  private seq = 0;

  private nextStamp(): string {
    this.seq += 1;
    return new Date(Date.now() + this.seq * 1000).toISOString();
  }

  addList(id: string): FakeList {
    const list: FakeList = { id, status: "active" };
    this.lists.set(id, list);
    return list;
  }

  addItem(
    listId: string,
    name: string,
    category: ShoppingCategory,
    clientId: string | null = null,
  ): ShoppingItem {
    const stamp = this.nextStamp();
    const item: ShoppingItem = {
      id: `srv_item_${this.seq}`,
      clientId,
      listId,
      name,
      normalizedName: name.toLowerCase(),
      amount: null,
      note: null,
      category,
      status: "pending",
      sortOrder: this.items.size,
      addedByUserId: ACTOR_ID,
      updatedByUserId: ACTOR_ID,
      createdAt: stamp,
      updatedAt: stamp,
    };
    this.items.set(item.id, item);
    return item;
  }

  openSession(listId: string): string {
    this.seq += 1;
    const id = `srv_session_${this.seq}`;
    this.sessions.set(id, { id, listId, finishedAt: null });
    return id;
  }

  itemsByClientId(clientId: string): ShoppingItem[] {
    return [...this.items.values()].filter((i) => i.clientId === clientId);
  }

  /**
   * The next matching request fails like a dropped connection. `before`: it
   * never reaches the server. `after`: the server applies it and the response
   * is lost on the way back.
   */
  dropConnection(method: string, path: string, when: Fault["when"]): void {
    this.faults.push({ method, path, when });
  }

  readonly fetch = async (
    input: string | URL | Request,
    init: RequestInit = {},
  ): Promise<Response> => {
    const url = new URL(String(input));
    const method = (init.method ?? "GET").toUpperCase();
    if (!this.online) throw new TypeError("Network request failed");

    const faultIndex = this.faults.findIndex(
      (f) => f.method === method && f.path === url.pathname,
    );
    const fault =
      faultIndex >= 0 ? this.faults.splice(faultIndex, 1)[0] : undefined;
    if (fault?.when === "before") throw new TypeError("Network request failed");

    this.requests.push(`${method} ${url.pathname}`);
    const body =
      typeof init.body === "string" ? (JSON.parse(init.body) as unknown) : {};

    let response: Response;
    try {
      response = this.handle(method, url, body as Record<string, unknown>);
    } catch (error) {
      if (!(error instanceof HttpError)) throw error;
      response = json(error.status, {
        code: error.code,
        message: error.message,
      });
    }

    if (fault?.when === "after") throw new TypeError("Network request failed");
    return response;
  };

  /** authorizeList: deleted lists are gone; archived only when allowed. */
  private authorizeList(listId: string, allowArchived = false): FakeList {
    const list = this.lists.get(listId);
    if (!list || list.status === "deleted") {
      throw new HttpError(404, "NOT_FOUND", "List not found.");
    }
    if (list.status === "archived" && !allowArchived) {
      throw new HttpError(404, "NOT_FOUND", "List not found.");
    }
    return list;
  }

  private finishSession(list: FakeList, session: FakeSession) {
    this.events.push("ShoppingFinished");
    list.status = "archived";
    session.finishedAt = this.nextStamp();
    return {
      id: session.id,
      listId: list.id,
      finishedAt: session.finishedAt,
      alreadyFinished: false,
    };
  }

  private handle(
    method: string,
    url: URL,
    body: Record<string, unknown>,
  ): Response {
    const parts = url.pathname.split("/").filter(Boolean);

    if (method === "GET" && url.pathname === "/api/health") {
      return json(200, { status: "ok", timestamp: new Date().toISOString() });
    }

    // PATCH /api/v1/items/:itemId - looks the item up by server id only.
    if (method === "PATCH" && parts[2] === "items" && parts.length === 4) {
      const item = this.items.get(parts[3]!);
      if (!item) throw new HttpError(404, "NOT_FOUND", "Item not found.");
      this.authorizeList(item.listId);
      const next: ShoppingItem = {
        ...item,
        ...(typeof body.status === "string"
          ? { status: body.status as ItemStatus }
          : {}),
        updatedByUserId: ACTOR_ID,
        updatedAt: this.nextStamp(),
      };
      this.items.set(item.id, next);
      return json(200, next);
    }

    if (parts[2] !== "lists" || !parts[3]) {
      throw new HttpError(404, "NOT_FOUND", "Route not found.");
    }
    const listId = parts[3];
    const rest = parts.slice(4).join("/");

    // GET /api/v1/lists/:listId/items
    if (method === "GET" && rest === "items") {
      this.authorizeList(listId, url.searchParams.get("allowArchived") === "1");
      const items = [...this.items.values()].filter((i) => i.listId === listId);
      return json(200, { items });
    }

    // POST /api/v1/lists/:listId/items - clientId is unique (P2002 → 409).
    if (method === "POST" && rest === "items") {
      this.authorizeList(listId);
      const clientId = String(body.clientId ?? "");
      if (this.itemsByClientId(clientId).length > 0) {
        throw new HttpError(409, "CONFLICT", "Item clientId already exists.");
      }
      const created = this.addItem(
        listId,
        String(body.name),
        body.category as ShoppingCategory,
        clientId,
      );
      return json(201, created);
    }

    // DELETE /api/v1/lists/:listId - user "Delete list": hidden everywhere.
    if (method === "DELETE" && rest === "") {
      const list = this.authorizeList(listId, true);
      list.status = "deleted";
      this.events.push("ShoppingListDeleted");
      return new Response(null, { status: 204 });
    }

    // POST /api/v1/lists/:listId/sessions/:sessionId/finish
    if (method === "POST" && parts[4] === "sessions" && parts[6] === "finish") {
      const list = this.authorizeList(listId);
      const session = this.sessions.get(parts[5]!);
      if (!session || session.listId !== listId) {
        throw new HttpError(404, "NOT_FOUND", "Shopping session not found.");
      }
      if (session.finishedAt) {
        return json(200, {
          id: session.id,
          listId,
          finishedAt: session.finishedAt,
          alreadyFinished: true,
        });
      }
      return json(200, this.finishSession(list, session));
    }

    // POST /api/v1/lists/:listId/finish - finish without a known session id.
    if (method === "POST" && rest === "finish") {
      const list = this.authorizeList(listId, true);
      if (list.status === "archived") {
        return json(200, { listId, sessionId: null, alreadyFinished: true });
      }
      const open = [...this.sessions.values()].find(
        (s) => s.listId === listId && !s.finishedAt,
      );
      if (open) {
        const finished = this.finishSession(list, open);
        return json(200, {
          listId,
          sessionId: finished.id,
          alreadyFinished: false,
        });
      }
      list.status = "archived";
      return json(200, { listId, sessionId: null, alreadyFinished: false });
    }

    throw new HttpError(404, "NOT_FOUND", "Route not found.");
  }
}

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let api = new FakeKangurApi();
let queryClient = new QueryClient();
let listCounter = 0;

function newListId(): string {
  listCounter += 1;
  return `list-${listCounter}`;
}

function activeItems(listId: string): ShoppingItem[] {
  return (
    queryClient.getQueryData<ShoppingItem[]>(
      shoppingItemsQueryKey(listId, "active"),
    ) ?? []
  );
}

/** Same row the shopping screen writes before calling session.addItem. */
function optimisticRow(
  listId: string,
  clientId: string,
  name: string,
  category: ShoppingCategory,
): ShoppingItem {
  const now = new Date().toISOString();
  return {
    id: clientId,
    clientId,
    listId,
    name,
    normalizedName: name.toLowerCase(),
    amount: null,
    note: null,
    category,
    status: "pending",
    sortOrder: 9999,
    addedByUserId: "",
    updatedByUserId: "",
    createdAt: now,
    updatedAt: now,
  };
}

/** Shopping screen: optimistic cache patch, then the session call. */
async function tick(listId: string, itemId: string, status: ItemStatus) {
  queryClient.setQueryData<ShoppingItem[]>(
    shoppingItemsQueryKey(listId, "active"),
    (prev) => prev?.map((i) => (i.id === itemId ? { ...i, status } : i)),
  );
  await ShoppingSession.setItemStatus(listId, { itemId, status });
}

/** Shopping screen add sheet: optimistic row, then the session call. */
async function addOffline(
  listId: string,
  name: string,
  category: ShoppingCategory,
): Promise<string> {
  const clientId = randomUUID();
  queryClient.setQueryData<ShoppingItem[]>(
    shoppingItemsQueryKey(listId, "active"),
    (prev) => [
      ...(prev ?? []),
      optimisticRow(listId, clientId, name, category),
    ],
  );
  await ShoppingSession.addItem(listId, { clientId, name, category });
  return clientId;
}

function loseSignal(): void {
  api.online = false;
  DataSyncEngine.connectivity.setOnline(false);
}

/** Signal is back and the app noticed (foreground probe or a request). */
function signalBack(): void {
  api.online = true;
  DataSyncEngine.connectivity.setOnline(true);
}

/** Let the engine replay until the queue settles, as its retries would. */
async function replayUntilSettled(): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (api.online) DataSyncEngine.connectivity.setOnline(true);
    await DataSyncEngine.flush();
    if ((await DataSyncEngine.pendingCount()) === 0) return;
  }
}

/**
 * The shopping trip from the bug report: shopping mode opened online on a
 * list with milk, signal lost in the store, milk ticked, bread added and
 * ticked, trip finished offline.
 */
async function shopOfflineAndFinish(options: { withServerSession: boolean }) {
  const listId = newListId();
  api.addList(listId);
  const milk = api.addItem(listId, "Mleko", "dairy");
  queryClient.setQueryData(shoppingItemsQueryKey(listId, "active"), [milk]);

  await ShoppingSession.start(listId, WORKSPACE_ID);
  let sessionId: string | null = null;
  if (options.withServerSession) {
    sessionId = api.openSession(listId);
    await ShoppingSession.setServerSessionId(listId, sessionId);
  }

  loseSignal();
  await tick(listId, milk.id, "bought");
  const breadClientId = await addOffline(listId, "Chleb", "bakery");
  await tick(listId, breadClientId, "bought");
  await ShoppingSession.finish(listId);
  await ShoppingSession.clearEnded(listId);

  return { listId, milk, breadClientId, sessionId };
}

before(() => {
  // Debounce timers never fire on their own; tests drive the replay.
  mock.timers.enable({ apis: ["setTimeout"] });
  process.env.EXPO_PUBLIC_API_URL = API_URL;
  globalThis.fetch = (input, init) => api.fetch(input, init);
  DataSyncEngine.start(createRestSyncTransport(async () => TOKEN));
});

after(() => {
  mock.timers.reset();
});

beforeEach(async () => {
  api = new FakeKangurApi();
  queryClient = new QueryClient();
  DataSyncEngine.setSyncCacheAdapter(
    new ReactQuerySyncCacheAdapter(queryClient),
  );
  DataSyncEngine.connectivity.setOnline(true);
  await DataSyncEngine.clear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("finishing a shopping trip offline", () => {
  it("moves the list to History when the signal is back, it does not delete it", async () => {
    const { listId, sessionId } = await shopOfflineAndFinish({
      withServerSession: true,
    });
    assert.equal(api.lists.get(listId)?.status, "active");

    signalBack();
    await replayUntilSettled();

    assert.equal(api.lists.get(listId)?.status, "archived");
    assert.deepEqual(api.events, ["ShoppingFinished"]);
    assert.notEqual(api.sessions.get(sessionId!)?.finishedAt, null);
    assert.equal(await DataSyncEngine.pendingCount(), 0);
  });

  it("archives the list even when the trip never got a server session", async () => {
    const { listId } = await shopOfflineAndFinish({ withServerSession: false });

    signalBack();
    await replayUntilSettled();

    assert.equal(api.lists.get(listId)?.status, "archived");
    assert.ok(!api.events.includes("ShoppingListDeleted"));
    assert.equal(await DataSyncEngine.pendingCount(), 0);
  });

  it("saves an item added and ticked offline as bought", async () => {
    const { listId, milk, breadClientId } = await shopOfflineAndFinish({
      withServerSession: true,
    });

    signalBack();
    await replayUntilSettled();

    assert.equal(api.items.get(milk.id)?.status, "bought");
    const bread = api.itemsByClientId(breadClientId);
    assert.equal(bread.length, 1, "bread exists once on the server");
    assert.equal(bread[0]!.listId, listId);
    assert.equal(bread[0]!.status, "bought", "its offline tick survives");
  });

  it("keeps the added item ticked in the app's cache after the replay", async () => {
    const { listId, breadClientId } = await shopOfflineAndFinish({
      withServerSession: true,
    });

    signalBack();
    await replayUntilSettled();

    const server = api.itemsByClientId(breadClientId)[0];
    const rows = activeItems(listId).filter(
      (i) => i.clientId === breadClientId,
    );
    assert.equal(rows.length, 1, "one row for bread, no duplicate");
    assert.equal(rows[0]!.id, server?.id, "row now carries the server id");
    assert.equal(rows[0]!.status, "bought");
  });

  it("waits with the archive while an earlier change could not be sent", async () => {
    const { listId, milk, breadClientId } = await shopOfflineAndFinish({
      withServerSession: true,
    });
    // Signal flickers: the first tick is lost on the way to the server.
    api.dropConnection("PATCH", `/api/v1/items/${milk.id}`, "before");

    signalBack();
    await replayUntilSettled();

    assert.equal(api.items.get(milk.id)?.status, "bought");
    assert.equal(api.itemsByClientId(breadClientId)[0]?.status, "bought");
    assert.equal(api.lists.get(listId)?.status, "archived");
    const finishAt = api.requests.findIndex((r) => r.endsWith("/finish"));
    const lastItemWrite = api.requests.findLastIndex(
      (r) => r.startsWith("PATCH /api/v1/items/") || r.endsWith("/items"),
    );
    assert.ok(finishAt > lastItemWrite, "finish is the last request");
  });

  it("keeps one bought item when the response to the add is lost", async () => {
    const { listId, breadClientId } = await shopOfflineAndFinish({
      withServerSession: true,
    });
    // The server creates bread, but the answer never reaches the phone.
    api.dropConnection("POST", `/api/v1/lists/${listId}/items`, "after");

    signalBack();
    await replayUntilSettled();

    const bread = api.itemsByClientId(breadClientId);
    assert.equal(bread.length, 1);
    assert.equal(bread[0]!.status, "bought");
    assert.equal(api.lists.get(listId)?.status, "archived");
    assert.equal(await DataSyncEngine.pendingCount(), 0);
  });

  it("sends everything at the checkout when the signal is back but the app still thinks it is offline", async () => {
    const listId = newListId();
    api.addList(listId);
    const milk = api.addItem(listId, "Mleko", "dairy");
    queryClient.setQueryData(shoppingItemsQueryKey(listId, "active"), [milk]);
    await ShoppingSession.start(listId, WORKSPACE_ID);
    await ShoppingSession.setServerSessionId(listId, api.openSession(listId));

    loseSignal();
    await tick(listId, milk.id, "bought");
    const breadClientId = await addOffline(listId, "Chleb", "bakery");
    await tick(listId, breadClientId, "bought");

    // Walking out of the store: the network is back, nothing told the app.
    api.online = true;
    await ShoppingSession.finish(listId);
    await ShoppingSession.clearEnded(listId);

    assert.equal(api.lists.get(listId)?.status, "archived");
    assert.equal(api.items.get(milk.id)?.status, "bought");
    assert.equal(api.itemsByClientId(breadClientId)[0]?.status, "bought");
    assert.equal(await DataSyncEngine.pendingCount(), 0);
  });

  it("drops changes for a list someone else deleted instead of retrying forever", async () => {
    const { listId } = await shopOfflineAndFinish({ withServerSession: true });
    api.lists.get(listId)!.status = "deleted";

    signalBack();
    await replayUntilSettled();

    assert.equal(await DataSyncEngine.pendingCount(), 0);
    assert.ok(!api.requests.includes(`DELETE /api/v1/lists/${listId}`));
  });
});

describe("refresh while offline changes are still queued", () => {
  it("keeps the added item and its tick when the list is fetched again", async () => {
    const listId = newListId();
    api.addList(listId);
    const milk = api.addItem(listId, "Mleko", "dairy");
    queryClient.setQueryData(shoppingItemsQueryKey(listId, "active"), [milk]);
    await ShoppingSession.start(listId, WORKSPACE_ID);

    loseSignal();
    const breadClientId = await addOffline(listId, "Chleb", "bakery");
    await tick(listId, breadClientId, "bought");

    // Network back, queue not replayed yet, the summary screen refetches.
    api.online = true;
    const serverItems = await listShoppingItems(TOKEN, listId);
    const merged = await DataSyncEngine.reconcileServerSnapshot(
      listId,
      serverItems,
    );

    const bread = merged.find((i) => i.clientId === breadClientId);
    assert.ok(bread, "the added item is still on the list");
    assert.equal(bread.status, "bought");
    assert.equal(merged.find((i) => i.id === milk.id)?.status, "pending");
  });
});

describe("queue saved by app 1.0.8", () => {
  it("replays in the order the user acted and archives instead of deleting", async () => {
    const listId = newListId();
    api.addList(listId);
    const milk = api.addItem(listId, "Mleko", "dairy");
    api.openSession(listId);
    const breadClientId = randomUUID();
    const at = (s: number) => new Date(Date.UTC(2026, 10, 20, 10, 0, s)).toISOString();

    // Shape and priorities exactly as 1.0.8 persisted them.
    const legacy: SyncOperation[] = [
      {
        id: "op-1",
        queueVersion: 1,
        listId,
        itemId: milk.id,
        action: "SET_STATUS",
        payload: { status: "bought" },
        createdAt: at(1),
        priority: 10,
        state: "PENDING",
      },
      {
        id: "op-2",
        queueVersion: 1,
        listId,
        itemId: breadClientId,
        action: "ADD_ITEM",
        payload: { clientId: breadClientId, name: "Chleb", category: "bakery" },
        createdAt: at(2),
        priority: 20,
        state: "PENDING",
      },
      {
        id: "op-3",
        queueVersion: 1,
        listId,
        itemId: breadClientId,
        action: "SET_STATUS",
        payload: { status: "bought" },
        createdAt: at(3),
        priority: 10,
        state: "FAILED",
      },
      {
        id: "op-4",
        queueVersion: 1,
        listId,
        action: "ARCHIVE_LIST",
        payload: {},
        createdAt: at(4),
        priority: 100,
        state: "PENDING",
      },
    ];
    await DataSyncEngine.queue.replaceAll(legacy);

    await replayUntilSettled();

    assert.equal(api.lists.get(listId)?.status, "archived");
    assert.ok(!api.events.includes("ShoppingListDeleted"));
    assert.equal(api.items.get(milk.id)?.status, "bought");
    assert.equal(api.itemsByClientId(breadClientId)[0]?.status, "bought");
    assert.equal(await DataSyncEngine.pendingCount(), 0);
  });
});

describe("replay order", () => {
  const op = (
    overrides: Partial<SyncOperation> &
      Pick<SyncOperation, "id" | "action" | "createdAt">,
  ): SyncOperation => ({
    queueVersion: 1,
    listId: "list-x",
    payload: {},
    priority: 10,
    state: "PENDING",
    ...overrides,
  });
  const order = (ops: SyncOperation[]) =>
    [...ops].sort(compareReplayOrder).map((o) => o.id);

  it("keeps an add before its tick within the same millisecond", () => {
    const sameMs = "2026-11-26T10:00:00.000Z";
    const add = op({ id: "zz-add", action: "ADD_ITEM", createdAt: sameMs, seq: 1 });
    const tick = op({ id: "aa-tick", action: "SET_STATUS", createdAt: sameMs, seq: 2 });
    assert.deepEqual(order([tick, add]), ["zz-add", "aa-tick"]);
  });

  it("keeps the enqueue order when the clock moved back", () => {
    const add = op({ id: "add", action: "ADD_ITEM", createdAt: "2026-11-26T10:00:05.000Z", seq: 1 });
    const tick = op({ id: "tick", action: "SET_STATUS", createdAt: "2026-11-26T10:00:02.000Z", seq: 2 });
    assert.deepEqual(order([tick, add]), ["add", "tick"]);
  });

  it("puts ops saved by 1.0.8 first, by time, and the finish last", () => {
    const legacyAdd = op({ id: "l-add", action: "ADD_ITEM", createdAt: "2026-11-20T10:00:01.000Z", priority: 20 });
    const legacyTick = op({ id: "l-tick", action: "SET_STATUS", createdAt: "2026-11-20T10:00:02.000Z", priority: 10 });
    const finish = op({ id: "finish", action: "ARCHIVE_LIST", createdAt: "2026-11-26T10:00:00.000Z", seq: 1, priority: 100 });
    const newTick = op({ id: "n-tick", action: "SET_STATUS", createdAt: "2026-11-26T10:00:01.000Z", seq: 2 });
    assert.deepEqual(order([finish, newTick, legacyTick, legacyAdd]), [
      "l-add",
      "l-tick",
      "n-tick",
      "finish",
    ]);
  });
});
