import assert from "node:assert/strict";
import test from "node:test";

import {
  checkDisplayName,
  isPrivateRelayEmail,
  labelPeople,
  nameFromEmail,
  nameFromProvider,
  resolveDisplayName,
  type NameWords,
} from "@/lib/names/displayName";

const RELAY = "sfnud34snsn@privaterelay.appleid.com";
const words: NameWords = {
  fallback: "Domownik",
  since: (d) => `od ${d.getUTCDate()}.${d.getUTCMonth() + 1}`,
};

test("a name typed in Kangur or copied from Clerk wins", () => {
  assert.equal(resolveDisplayName({ displayName: "Kasia", email: "jan.nowak@gmail.com" }), "Kasia");
  assert.equal(resolveDisplayName({ displayName: "  Kasia   Nowak ", email: RELAY }), "Kasia Nowak");
});

test("the start of the address only when it looks like a first name", () => {
  assert.equal(nameFromEmail("kasia.nowak@gmail.com"), "Kasia");
  assert.equal(nameFromEmail("JAN@wp.pl"), "Jan");
  assert.equal(nameFromEmail("łucja_k@o2.pl"), "Łucja");
  assert.equal(nameFromEmail("chris38pl@gmail.com"), null);
  assert.equal(nameFromEmail("xkcdz@gmail.com"), null);
  assert.equal(nameFromEmail("biuro@firma.pl"), null);
  assert.equal(nameFromEmail("a@b.pl"), null);
  assert.equal(resolveDisplayName({ displayName: null, email: "kasia.nowak@gmail.com" }), "Kasia");
});

test("an Apple relay address never becomes a name", () => {
  assert.equal(isPrivateRelayEmail(RELAY), true);
  assert.equal(isPrivateRelayEmail("Kasia@PrivateRelay.AppleId.com"), true);
  assert.equal(isPrivateRelayEmail("kasia@gmail.com"), false);
  assert.equal(nameFromEmail("kasia@privaterelay.appleid.com"), null);
  assert.equal(resolveDisplayName({ displayName: null, email: RELAY }), null);
  // Even a relay address stored as a name by mistake.
  assert.equal(resolveDisplayName({ displayName: RELAY, email: RELAY }), null);
});

test("no name at all: null, the caller shows Domownik", () => {
  assert.equal(resolveDisplayName({ displayName: null, email: "123456@gmail.com" }), null);
  assert.equal(resolveDisplayName({}), null);
});

test("the Clerk name: first name, the initial of the last one", () => {
  assert.deepEqual(nameFromProvider("Kasia", "Nowak"), { displayName: "Kasia", lastNameInitial: "N" });
  assert.deepEqual(nameFromProvider(" ", "Nowak"), { displayName: "Nowak", lastNameInitial: null });
  assert.deepEqual(nameFromProvider(null, null), { displayName: null, lastNameInitial: null });
  assert.deepEqual(nameFromProvider("kasia@gmail.com", "Nowak"), { displayName: "Nowak", lastNameInitial: null });
  assert.equal(nameFromProvider("A".repeat(40), null).displayName, "A".repeat(30));
});

test("a typed name: 1 to 30 characters, not an address", () => {
  assert.deepEqual(checkDisplayName("  Kasia  "), { ok: true, name: "Kasia" });
  assert.deepEqual(checkDisplayName("Ka​sia"), { ok: true, name: "Kasia" });
  assert.deepEqual(checkDisplayName("   "), { ok: false, reason: "empty" });
  assert.deepEqual(checkDisplayName("kasia@gmail.com"), { ok: false, reason: "email" });
  assert.deepEqual(checkDisplayName("x".repeat(31)), { ok: false, reason: "too_long" });
  // A family emoji keeps its joiner (U+200D).
  assert.deepEqual(checkDisplayName("Ola 👩‍👧"), { ok: true, name: "Ola 👩‍👧" });
});

test("two people of one name: the initial, or the day they joined", () => {
  const labels = labelPeople(
    [
      { userId: "a", name: "Kasia", lastNameInitial: "N", joinedAt: new Date("2026-11-12T10:00:00Z") },
      { userId: "b", name: "kasia", lastNameInitial: "K", joinedAt: new Date("2026-11-20T10:00:00Z") },
      { userId: "c", name: "Jan", lastNameInitial: null, joinedAt: new Date("2026-11-01T10:00:00Z") },
    ],
    words,
  );
  assert.equal(labels.get("a"), "Kasia N.");
  assert.equal(labels.get("b"), "kasia K.");
  assert.equal(labels.get("c"), "Jan");

  const sameInitial = labelPeople(
    [
      { userId: "a", name: "Kasia", lastNameInitial: "N", joinedAt: new Date("2026-11-12T10:00:00Z") },
      { userId: "b", name: "Kasia", lastNameInitial: "N", joinedAt: new Date("2026-11-20T10:00:00Z") },
    ],
    words,
  );
  assert.equal(sameInitial.get("a"), "Kasia · od 12.11");
  assert.equal(sameInitial.get("b"), "Kasia · od 20.11");
});

test("two without a name are told apart too, never by address", () => {
  const labels = labelPeople(
    [
      { userId: "a", name: null, joinedAt: new Date("2026-11-12T10:00:00Z") },
      { userId: "b", name: null, joinedAt: new Date("2026-11-20T10:00:00Z") },
      { userId: "c", name: null, joinedAt: new Date("2026-11-21T10:00:00Z") },
    ].slice(0, 2),
    words,
  );
  assert.equal(labels.get("a"), "Domownik · od 12.11");
  assert.equal(labels.get("b"), "Domownik · od 20.11");
  const alone = labelPeople([{ userId: "a", name: null, joinedAt: new Date() }], words);
  assert.equal(alone.get("a"), "Domownik");
});
