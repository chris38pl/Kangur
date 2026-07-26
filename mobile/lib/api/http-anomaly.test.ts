import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  HTTP_STORM_THRESHOLD,
  createHttpStormStore,
  normalizeHttpPath,
  recordHttpStormHit,
} from "./http-anomaly.ts";

describe("normalizeHttpPath", () => {
  it("collapses cuid / opaque ids to :id", () => {
    assert.equal(
      normalizeHttpPath(
        "http://100.70.226.99:3000/api/v1/workspaces/cmrnyj82t0002ufwgvzc63vnv/lists",
      ),
      "/api/v1/workspaces/:id/lists",
    );
  });

  it("collapses numeric and hex-like segments", () => {
    assert.equal(
      normalizeHttpPath("/api/v1/lists/42/events"),
      "/api/v1/lists/:id/events",
    );
    assert.equal(
      normalizeHttpPath("/api/v1/items/abcdef12/route"),
      "/api/v1/items/:id/route",
    );
  });

  it("keeps static route segments", () => {
    assert.equal(
      normalizeHttpPath("/api/v1/me/notification-preferences"),
      "/api/v1/me/notification-preferences",
    );
  });
});

describe("recordHttpStormHit", () => {
  it("does not storm below threshold", () => {
    const store = createHttpStormStore();
    let stormed = false;
    for (let i = 0; i < HTTP_STORM_THRESHOLD - 1; i++) {
      const hit = recordHttpStormHit({
        method: "GET",
        url: "/api/v1/workspaces/abc12345/lists",
        now: 1_000 + i,
        store,
      });
      if (hit.stormed) stormed = true;
    }
    assert.equal(stormed, false);
  });

  it("storms once at threshold then respects cooldown", () => {
    const store = createHttpStormStore();
    const base = 10_000;
    let stormCount = 0;
    for (let i = 0; i < HTTP_STORM_THRESHOLD; i++) {
      const hit = recordHttpStormHit({
        method: "GET",
        url: "/api/v1/workspaces/abc12345/lists",
        now: base + i,
        store,
        cooldownMs: 30_000,
      });
      if (hit.stormed) stormCount += 1;
    }
    assert.equal(stormCount, 1);

    const duringCooldown = recordHttpStormHit({
      method: "GET",
      url: "/api/v1/workspaces/abc12345/lists",
      now: base + HTTP_STORM_THRESHOLD + 100,
      store,
      cooldownMs: 30_000,
    });
    assert.equal(duringCooldown.stormed, false);
    assert.ok(duringCooldown.count >= HTTP_STORM_THRESHOLD);
  });

  it("sliding window drops old hits (10 then gap 11s then 10 → no storm)", () => {
    const store = createHttpStormStore();
    const t0 = 100_000;
    for (let i = 0; i < 10; i++) {
      const hit = recordHttpStormHit({
        method: "GET",
        url: "/api/v1/lists/cmrxrr1ab0bk7ufv4vkabdvre/events",
        now: t0 + i,
        store,
        windowMs: 10_000,
        threshold: 20,
      });
      assert.equal(hit.stormed, false);
    }
    for (let i = 0; i < 10; i++) {
      const hit = recordHttpStormHit({
        method: "GET",
        url: "/api/v1/lists/otherid99zzzzzzzz/events",
        now: t0 + 11_000 + i,
        store,
        windowMs: 10_000,
        threshold: 20,
      });
      assert.equal(hit.stormed, false, "old window should have expired");
      assert.ok(hit.count <= 10);
    }
  });

  it("aggregates different concrete ids into one storm key", () => {
    const store = createHttpStormStore();
    const t0 = 200_000;
    let lastKey = "";
    for (let i = 0; i < HTTP_STORM_THRESHOLD; i++) {
      const hit = recordHttpStormHit({
        method: "GET",
        url: `/api/v1/lists/listid${1000 + i}xxxx/events`,
        now: t0 + i,
        store,
      });
      lastKey = hit.key;
      if (i === HTTP_STORM_THRESHOLD - 1) {
        assert.equal(hit.stormed, true);
        assert.equal(hit.path, "/api/v1/lists/:id/events");
        assert.equal(hit.key, "GET /api/v1/lists/:id/events");
        assert.equal(hit.count, HTTP_STORM_THRESHOLD);
        assert.ok(hit.durationMs >= 0);
        assert.ok(hit.firstSeenAgoMs >= 0);
      }
    }
    assert.equal(lastKey, "GET /api/v1/lists/:id/events");
  });
});
