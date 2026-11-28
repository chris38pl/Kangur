import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_VERSION_HEADER,
  clientSupports,
  compareVersions,
  readClientVersion,
} from "@/lib/clientVersion";

test("no header is app 1.0.8: none of the new things", () => {
  const version = readClientVersion(new Request("https://x.test/api"));
  assert.equal(version, null);
  assert.equal(clientSupports(version, "linkInvitations"), false);
  assert.equal(clientSupports(version, "memberJoinedNotifications"), false);
  assert.equal(clientSupports(version, "hiddenMemberEmail"), false);
});

test("1.0.9 and newer get them, older and odd values do not", () => {
  const ask = (value: string) =>
    clientSupports(
      readClientVersion(new Request("https://x.test", { headers: { [APP_VERSION_HEADER]: value } })),
      "linkInvitations",
    );
  assert.equal(ask("1.0.9"), true);
  assert.equal(ask("1.0.10"), true);
  assert.equal(ask("1.1.0"), true);
  assert.equal(ask("2.0.0"), true);
  assert.equal(ask("1.0.8"), false);
  assert.equal(ask("0.9.99"), false);
  assert.equal(ask("1.0.9-beta"), false);
  assert.equal(ask("latest"), false);
  assert.equal(ask(""), false);
});

test("versions compare by number, not by text", () => {
  assert.equal(compareVersions("1.0.10", "1.0.9"), 1);
  assert.equal(compareVersions("1.0.9", "1.0.9"), 0);
  assert.equal(compareVersions("1.0.8", "1.0.9"), -1);
  assert.equal(compareVersions("1.0", "1.0.9"), null);
});
