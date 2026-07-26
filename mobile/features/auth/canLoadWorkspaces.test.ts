import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canLoadWorkspaces } from "./canLoadWorkspaces.ts";

describe("canLoadWorkspaces", () => {
  it("keeps workspaces disabled while /me is pending", () => {
    assert.equal(
      canLoadWorkspaces({ isSignedIn: true, meStatus: "pending" }),
      false,
    );
  });

  it("keeps workspaces disabled when /me fails", () => {
    assert.equal(
      canLoadWorkspaces({ isSignedIn: true, meStatus: "error" }),
      false,
    );
  });

  it("keeps workspaces disabled when signed out even if me succeeded", () => {
    assert.equal(
      canLoadWorkspaces({ isSignedIn: false, meStatus: "success" }),
      false,
    );
  });

  it("enables workspaces only after /me success (post-latency)", async () => {
    let meStatus: "pending" | "error" | "success" = "pending";
    assert.equal(
      canLoadWorkspaces({ isSignedIn: true, meStatus }),
      false,
      "workspaces must not start before /me",
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    meStatus = "success";

    assert.equal(
      canLoadWorkspaces({ isSignedIn: true, meStatus }),
      true,
      "workspaces may start only after /me bootstrap completes",
    );
  });
});
