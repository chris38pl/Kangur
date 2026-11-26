import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { encodeQr, qrPath, type QrMatrix } from "@/lib/marketing/qr/encode";

const address = (length: number) =>
  "https://www.getkangur.com/wigilia#k=".padEnd(length, "eyJwIjp7InBlb3BsZSI6Nn19_-");

const print = (code: QrMatrix) => createHash("sha256").update(qrPath(code)).digest("hex").slice(0, 16);

/** The dark and light rings in three corners, by which a phone finds the code. */
function assertFinders({ size, dark }: QrMatrix) {
  for (const [left, top] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
        assert.equal(dark[top + y][left + x], ring !== 2, `${size}: ${x},${y}`);
      }
    }
  }
}

test("codes of every size are the ones other programs draw", () => {
  // Compared module by module with the "qrcode" library and read back with jsQR on 25.11.2026.
  const known: readonly [length: number, size: number, hash: string][] = [
    [38, 29, "bb23bcd9d5ed6076"],
    [90, 37, "f855792d80d21f26"],
    [130, 41, "70b509d89cd603e8"],
    [200, 53, "bd9303ebc34b056c"],
    [300, 61, "c9fb1f11487b5bd9"],
    [430, 73, "85950d05b3b6d94f"],
    [640, 85, "45f8fd208e30a60f"],
    [900, 101, "b82b5a67656391ac"],
    [1003, 105, "2e825b1dbf98d366"],
  ];
  for (const [length, size, hash] of known) {
    const code = encodeQr(address(length));
    assert.ok(code);
    assert.equal(code.size, size, String(length));
    assert.equal(print(code), hash, String(length));
  }
});

test("a code grows with the text and stops where a phone would give up", () => {
  let before = 0;
  for (let length = 40; length <= 1003; length += 9) {
    const code = encodeQr(address(length));
    assert.ok(code, String(length));
    assert.equal((code.size - 17) % 4, 0);
    assert.ok(code.size >= before);
    before = code.size;
    assertFinders(code);
  }
  assert.equal(before, 105);
  assert.ok(encodeQr(address(1003)));
  assert.equal(encodeQr(address(1004)), null);
});

test("the path covers exactly the dark modules", () => {
  const code = encodeQr(address(60));
  assert.ok(code);
  const drawn = code.dark.map((row) => row.map(() => false));
  for (const [, x, y, run] of qrPath(code).matchAll(/M(\d+) (\d+)h(\d+)v1h-\3z/g)) {
    for (let i = 0; i < Number(run); i += 1) drawn[Number(y)][Number(x) + i] = true;
  }
  assert.deepEqual(drawn, code.dark);
});
