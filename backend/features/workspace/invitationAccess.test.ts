import assert from "node:assert/strict";
import test from "node:test";

import {
  invitationGate,
  invitationGoneError,
  needsAddressCheck,
  ownsInvitedAddress,
  wrongAccountError,
} from "@/features/workspace/invitationAccess";

const NOW = new Date("2026-11-28T12:00:00Z");
const LATER = new Date("2026-12-05T12:00:00Z");
const EARLIER = new Date("2026-11-27T12:00:00Z");

test("a valid link opens for anyone who holds it", () => {
  assert.deepEqual(
    invitationGate({ status: "pending", expiresAt: LATER, isMember: false, now: NOW }),
    { kind: "open" },
  );
  // The secret link is the key: no address is compared.
  assert.equal(needsAddressCheck("token"), false);
});

test("a used link is gone for someone else, not 'you are already here'", () => {
  assert.deepEqual(
    invitationGate({ status: "accepted", expiresAt: LATER, isMember: false, now: NOW }),
    { kind: "gone", reason: "used" },
  );
  assert.deepEqual(
    invitationGate({ status: "accepted", expiresAt: LATER, isMember: true, now: NOW }),
    { kind: "already_member" },
  );
});

test("expired and revoked links are gone", () => {
  assert.deepEqual(
    invitationGate({ status: "pending", expiresAt: EARLIER, isMember: false, now: NOW }),
    { kind: "gone", reason: "expired" },
  );
  assert.deepEqual(
    invitationGate({ status: "revoked", expiresAt: LATER, isMember: false, now: NOW }),
    { kind: "gone", reason: "revoked" },
  );
  const error = invitationGoneError("used");
  assert.equal(error.status, 404);
  assert.deepEqual(error.details, { reason: "used" });
});

test("by id from a notification: one of the verified addresses must match", () => {
  assert.equal(needsAddressCheck("invitationId"), true);
  assert.equal(ownsInvitedAddress("Kasia@Gmail.com", ["kasia@gmail.com"]), true);
  assert.equal(ownsInvitedAddress("kasia@gmail.com", ["x@privaterelay.appleid.com", "kasia@gmail.com"]), true);
  assert.equal(ownsInvitedAddress("kasia@gmail.com", ["jan@gmail.com"]), false);
  assert.equal(ownsInvitedAddress(null, ["jan@gmail.com"]), false);
});

test("the refusal never carries an Apple relay address", () => {
  const relay = wrongAccountError({ email: "x7k2@privaterelay.appleid.com", provider: "apple" });
  assert.equal(relay.status, 403);
  assert.equal(JSON.stringify(relay.toJSON()).includes("privaterelay.appleid.com"), false);
  assert.equal(relay.details?.reason, "email_mismatch");

  const real = wrongAccountError({ email: "jan@gmail.com", provider: "google" });
  assert.equal(real.details?.currentEmail, "jan@gmail.com");
});

test("app 1.0.8 prints a phrase where the hidden address would be, 1.0.9 gets nothing", () => {
  const hidden = "x7k2@privaterelay.appleid.com";
  const legacy = wrongAccountError({ email: hidden, provider: "apple", client: null, locale: "pl" });
  assert.equal(legacy.details?.currentEmail, "adres ukryty przez Apple");
  const english = wrongAccountError({ email: hidden, provider: "apple", locale: "en" });
  assert.equal(english.details?.currentEmail, "an address hidden by Apple");

  const current = wrongAccountError({ email: hidden, provider: "apple", client: "1.0.9", locale: "pl" });
  assert.equal("currentEmail" in (current.details ?? {}), false);

  // A real address stays for both: that screen shows it to its own owner.
  const real = wrongAccountError({ email: "jan@gmail.com", provider: "google", client: "1.0.9" });
  assert.equal(real.details?.currentEmail, "jan@gmail.com");
});
