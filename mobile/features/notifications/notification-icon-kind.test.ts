import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  NOTIFICATION_ICON_KINDS,
  NOTIFICATION_TILE_COLORS,
  notificationIconKind,
} from "@/features/notifications/notification-icon-kind";
import { KNOWN_NOTIFICATION_TYPES } from "@/features/notifications/schemas";

const ASSETS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../assets/notifications",
);

/** Width and height of a WebP with alpha (VP8X header). */
function webpSize(file: string): { width: number; height: number; bytes: number } {
  const buf = readFileSync(file);
  assert.equal(buf.toString("ascii", 0, 4), "RIFF", `${file} is not RIFF`);
  assert.equal(buf.toString("ascii", 8, 12), "WEBP", `${file} is not WebP`);
  assert.equal(buf.toString("ascii", 12, 16), "VP8X", `${file} has no alpha header`);
  return {
    width: 1 + buf.readUIntLE(24, 3),
    height: 1 + buf.readUIntLE(27, 3),
    bytes: buf.length,
  };
}

describe("notification icon kind", () => {
  it("gives every known type its own drawing", () => {
    const kinds = KNOWN_NOTIFICATION_TYPES.map((type) =>
      notificationIconKind({ type, payload: {} }),
    );
    assert.ok(!kinds.includes("default"));
    assert.equal(new Set(kinds).size, KNOWN_NOTIFICATION_TYPES.length);
  });

  it("shows the missing variant only when something was unavailable", () => {
    const finished = (payload: unknown) =>
      notificationIconKind({ type: "SHOPPING_FINISHED", payload });
    assert.equal(finished({ unavailableCount: 2, boughtCount: 18, itemCount: 20 }), "shopping-finished-missing");
    assert.equal(finished({ unavailableCount: 1 }), "shopping-finished-missing");
    assert.equal(finished({ unavailableCount: 0, boughtCount: 12, itemCount: 12 }), "shopping-finished");
    assert.equal(finished({}), "shopping-finished");
    assert.equal(finished(null), "shopping-finished");
    assert.equal(finished("2"), "shopping-finished");
    assert.equal(finished({ unavailableCount: "2" }), "shopping-finished");
    assert.equal(finished({ unavailableCount: Number.NaN }), "shopping-finished");
  });

  it("falls back to the portrait for a type this app does not know", () => {
    assert.equal(notificationIconKind({ type: "APP_UPDATE", payload: {} }), "default");
    assert.equal(notificationIconKind({ type: "", payload: null }), "default");
  });

  it("keeps every tile colour different", () => {
    const tiles = NOTIFICATION_ICON_KINDS.map((kind) => NOTIFICATION_TILE_COLORS[kind]);
    assert.equal(new Set(tiles).size, NOTIFICATION_ICON_KINDS.length);
  });
});

describe("notification icon files", () => {
  for (const kind of NOTIFICATION_ICON_KINDS) {
    it(`${kind} has light @2x and @3x files of 44x56 pt`, () => {
      for (const scale of [2, 3]) {
        const size = webpSize(path.join(ASSETS, `${kind}@${scale}x.webp`));
        assert.equal(size.width, 44 * scale);
        assert.equal(size.height, 56 * scale);
        assert.ok(size.bytes < 16_000, `${kind}@${scale}x.webp has ${size.bytes} bytes`);
      }
    });
  }
});
