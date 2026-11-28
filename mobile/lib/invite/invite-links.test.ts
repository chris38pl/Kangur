import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { inviteTokenFromUrl } from "./invite-url.ts";
import {
  PENDING_INVITE_MAX_AGE_MS,
  clearPendingInvite,
  isInviteReturnPath,
  pendingInvitePath,
  pendingInviteToken,
  rememberInviteForSignIn,
} from "./pending-invite.ts";

const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde";

describe("an invitation link of the site opens Join", () => {
  it("reads the token from the full link and from the path", () => {
    assert.equal(TOKEN.length, 43);
    assert.equal(inviteTokenFromUrl(`https://www.getkangur.com/invite#t=${TOKEN}`), TOKEN);
    assert.equal(inviteTokenFromUrl(`https://www.getkangur.com/en/invite#t=${TOKEN}`), TOKEN);
    assert.equal(inviteTokenFromUrl(`/invite#t=${TOKEN}`), TOKEN);
    assert.equal(inviteTokenFromUrl(`/de/invite/?utm_source=x#t=${TOKEN}`), TOKEN);
  });

  it("leaves every other link alone", () => {
    assert.equal(inviteTokenFromUrl("https://www.getkangur.com/invite"), null);
    assert.equal(inviteTokenFromUrl(`https://www.getkangur.com/faq#t=${TOKEN}`), null);
    assert.equal(inviteTokenFromUrl("https://www.getkangur.com/invite#t=short"), null);
    assert.equal(inviteTokenFromUrl(`kangur://invite/${TOKEN}`), null);
    assert.equal(inviteTokenFromUrl(`/invite#x=${TOKEN}`), null);
  });
});

describe("after sign-in the app returns to the invitation", () => {
  it("accepts only invitation paths", () => {
    assert.equal(isInviteReturnPath(`/invite/${TOKEN}`), true);
    assert.equal(isInviteReturnPath("/invite/id/cmx0dmy0m0007tyh0aobh1x58"), true);
    assert.equal(isInviteReturnPath("/invite/short"), false);
    assert.equal(isInviteReturnPath("/(tabs)"), false);
    assert.equal(isInviteReturnPath("https://evil.example/invite"), false);
  });

  it("remembers the way back and its token, until cleared", () => {
    rememberInviteForSignIn(`/invite/${TOKEN}`);
    assert.equal(pendingInvitePath(), `/invite/${TOKEN}`);
    assert.equal(pendingInviteToken(), TOKEN);
    rememberInviteForSignIn("/invite/id/abc");
    assert.equal(pendingInviteToken(), null);
    clearPendingInvite();
    assert.equal(pendingInvitePath(), null);
    rememberInviteForSignIn("/somewhere");
    assert.equal(pendingInvitePath(), null);
  });

  it("forgets the way back after half an hour", () => {
    const t0 = Date.UTC(2026, 10, 28, 12, 0, 0);
    rememberInviteForSignIn(`/invite/${TOKEN}`, t0);
    assert.equal(pendingInvitePath(t0 + 29 * 60_000), `/invite/${TOKEN}`);
    assert.equal(pendingInvitePath(t0 + PENDING_INVITE_MAX_AGE_MS + 1), null);
    assert.equal(pendingInviteToken(t0 + PENDING_INVITE_MAX_AGE_MS + 1), null);
    clearPendingInvite();
  });
});
