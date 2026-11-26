/**
 * The signal comes back while the app stays open. The app has to notice on
 * its own and send what was queued offline: on Android, airplane mode
 * switched off from the notification shade fires no AppState change.
 *
 * Runs the real DataSyncEngine, Connectivity and REST transport against a
 * small fake of the Kangur API, on mocked timers (no network, no waiting).
 *
 * Run from mobile/: pnpm test:reconnect
 */
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it, mock } from "node:test";

import { setAppStateForTest } from "../../scripts/node-test-stubs/react-native.mjs";
import type { ShoppingItem } from "../shopping-item/schemas.ts";
import { DataSyncEngine } from "./engine.ts";
import { createRestSyncTransport } from "./rest-transport.ts";

const API_URL = "http://kangur.test";
const TOKEN = "test-token";
const LIST_ID = "list-1";

/** While offline in the foreground, the app checks the connection this often. */
const RECHECK_MS = 15_000;
/** A check that gets no answer gives up after this long. */
const CHECK_TIMEOUT_MS = 5_000;
/** The engine waits this long before it sends queued changes. */
const FLUSH_DEBOUNCE_MS = 1_000;
/** Mocked time moves in steps this small, so async work runs in between. */
const STEP_MS = 250;

// ---------------------------------------------------------------------------
// Fake Kangur API: the health check and ticking an item
// ---------------------------------------------------------------------------

/**
 * up: requests get answers. down: they fail at once (airplane mode).
 * silent: no answer at all (one bar of signal) until aborted.
 * stalled: the answer starts and stops halfway until aborted (expo/fetch
 * resolves on the headers and reads the body afterwards).
 */
type Network = "up" | "down" | "silent" | "stalled";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

class FakeKangurApi {
  network: Network = "up";
  /** Health checks the app started, answered or not. */
  healthChecks = 0;
  readonly items = new Map<string, ShoppingItem>();

  addItem(id: string, name: string): ShoppingItem {
    const now = new Date().toISOString();
    const item: ShoppingItem = {
      id,
      clientId: null,
      listId: LIST_ID,
      name,
      normalizedName: name.toLowerCase(),
      amount: null,
      note: null,
      category: "dairy",
      status: "pending",
      sortOrder: this.items.size,
      addedByUserId: "user-1",
      updatedByUserId: "user-1",
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(id, item);
    return item;
  }

  readonly fetch = async (
    input: string | URL | Request,
    init: RequestInit = {},
  ): Promise<Response> => {
    const url = new URL(String(input));
    const method = (init.method ?? "GET").toUpperCase();
    if (url.pathname === "/api/health") this.healthChecks += 1;

    if (this.network === "down") throw new TypeError("Network request failed");
    const aborted = () =>
      new DOMException("The operation was aborted.", "AbortError");
    if (this.network === "silent") {
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(aborted()));
      });
    }
    if (this.network === "stalled") {
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          init.signal?.addEventListener("abort", () => controller.error(aborted()));
        },
      });
      return new Response(body, { status: 200 });
    }

    if (method === "GET" && url.pathname === "/api/health") {
      return json(200, { status: "ok", timestamp: new Date().toISOString() });
    }

    // PATCH /api/v1/items/:itemId
    const itemId = /^\/api\/v1\/items\/([^/]+)$/.exec(url.pathname)?.[1];
    const item = itemId ? this.items.get(itemId) : undefined;
    if (method === "PATCH" && item) {
      const body = JSON.parse(String(init.body)) as Partial<ShoppingItem>;
      const next: ShoppingItem = {
        ...item,
        status: body.status ?? item.status,
        updatedAt: new Date().toISOString(),
      };
      this.items.set(item.id, next);
      return json(200, next);
    }

    return json(404, { code: "NOT_FOUND", message: "Not found." });
  };
}

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let api = new FakeKangurApi();

/** Let the promise chains started so far run (check, flush, storage). */
async function settle(): Promise<void> {
  for (let i = 0; i < 50; i += 1) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

/** `ms` of time pass: due timers fire and the work they start completes. */
async function advance(ms: number): Promise<void> {
  await settle();
  for (let passed = 0; passed < ms; passed += STEP_MS) {
    mock.timers.tick(Math.min(STEP_MS, ms - passed));
    await settle();
  }
}

/** The user ticks an item in shopping mode. */
async function tick(itemId: string): Promise<void> {
  await DataSyncEngine.enqueue({
    listId: LIST_ID,
    itemId,
    action: "SET_STATUS",
    payload: { status: "bought" },
  });
}

/** Signal lost in the store: the next tick fails to send, the app goes offline. */
async function loseSignalWhileTicking(itemId: string): Promise<void> {
  api.network = "down";
  await tick(itemId);
  await advance(FLUSH_DEBOUNCE_MS);
  assert.equal(DataSyncEngine.isOnline(), false, "a failed send marks the app offline");
  assert.equal(await DataSyncEngine.pendingCount(), 1, "the tick waits on the phone");
}

before(async () => {
  mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  process.env.EXPO_PUBLIC_API_URL = API_URL;
  globalThis.fetch = (input, init) => api.fetch(input, init);
  DataSyncEngine.start(createRestSyncTransport(async () => TOKEN));
  await settle();
});

after(() => {
  mock.timers.reset();
});

beforeEach(async () => {
  api = new FakeKangurApi();
  setAppStateForTest("active");
  DataSyncEngine.connectivity.setOnline(true);
  await DataSyncEngine.clear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("signal back while the app stays open", () => {
  it("goes online within one check, with no app switch, and sends the ticks queued offline", async (t) => {
    // Same hook the realtime polling and the offline banner listen on.
    const heard: boolean[] = [];
    t.after(DataSyncEngine.connectivity.onChange((online) => heard.push(online)));
    const milk = api.addItem("srv_milk", "Mleko");
    const bread = api.addItem("srv_bread", "Chleb");
    await loseSignalWhileTicking(milk.id);
    await tick(bread.id);

    // Airplane mode off from the notification shade: no AppState change.
    api.network = "up";
    await advance(RECHECK_MS);
    assert.equal(DataSyncEngine.isOnline(), true, "online again within 15 s");

    await advance(FLUSH_DEBOUNCE_MS);
    assert.equal(api.items.get(milk.id)?.status, "bought");
    assert.equal(api.items.get(bread.id)?.status, "bought");
    assert.equal(await DataSyncEngine.pendingCount(), 0);
    assert.deepEqual(heard, [false, true], "offline once, then online once");
  });

  it("checks every 15 s while the signal stays away", async () => {
    const milk = api.addItem("srv_milk", "Mleko");
    await loseSignalWhileTicking(milk.id);
    const checks = api.healthChecks;

    await advance(RECHECK_MS * 3);

    assert.equal(api.healthChecks, checks + 3);
    assert.equal(DataSyncEngine.isOnline(), false);
    assert.equal(await DataSyncEngine.pendingCount(), 1);
  });

  it("stops checking once the signal is back", async () => {
    const milk = api.addItem("srv_milk", "Mleko");
    await loseSignalWhileTicking(milk.id);
    api.network = "up";
    await advance(RECHECK_MS + FLUSH_DEBOUNCE_MS);
    assert.equal(DataSyncEngine.isOnline(), true);
    const checks = api.healthChecks;

    await advance(RECHECK_MS * 4);

    assert.equal(api.healthChecks, checks, "no checks while online");
  });

  it("does not check in the background and checks again when the app returns", async () => {
    const milk = api.addItem("srv_milk", "Mleko");
    await loseSignalWhileTicking(milk.id);

    setAppStateForTest("background");
    api.network = "up";
    const checks = api.healthChecks;
    await advance(RECHECK_MS * 4);
    assert.equal(api.healthChecks, checks, "no checks in the background");
    assert.equal(DataSyncEngine.isOnline(), false);

    setAppStateForTest("active");
    await advance(FLUSH_DEBOUNCE_MS);
    assert.equal(DataSyncEngine.isOnline(), true);
    assert.equal(api.items.get(milk.id)?.status, "bought");
  });

  for (const [network, answer] of [
    ["silent", "no answer"],
    ["stalled", "an answer that stops halfway"],
  ] as const) {
    it(`gives up on a check that gets ${answer} and keeps checking`, async () => {
      const milk = api.addItem("srv_milk", "Mleko");
      await loseSignalWhileTicking(milk.id);

      // One bar of signal for the next check.
      api.network = network;
      await advance(RECHECK_MS + CHECK_TIMEOUT_MS);

      api.network = "up";
      await advance(RECHECK_MS);
      assert.equal(DataSyncEngine.isOnline(), true, "the next check still ran");

      await advance(FLUSH_DEBOUNCE_MS);
      assert.equal(api.items.get(milk.id)?.status, "bought");
    });
  }
});
