import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canLoadWorkspaces } from "./canLoadWorkspaces.ts";

describe("canLoadWorkspaces", () => {
  it("keeps workspaces disabled while /me is pending", () => {
    assert.equal(
      canLoadWorkspaces({
        isSignedIn: true,
        meStatus: "pending",
        sessionClerkId: "user_a",
        meClerkId: "user_a",
      }),
      false,
    );
  });

  it("keeps workspaces disabled when /me fails", () => {
    assert.equal(
      canLoadWorkspaces({
        isSignedIn: true,
        meStatus: "error",
        sessionClerkId: "user_a",
        meClerkId: "user_a",
      }),
      false,
    );
  });

  it("keeps workspaces disabled when signed out even if me succeeded", () => {
    assert.equal(
      canLoadWorkspaces({
        isSignedIn: false,
        meStatus: "success",
        sessionClerkId: "user_a",
        meClerkId: "user_a",
      }),
      false,
    );
  });

  it("keeps workspaces disabled when cached me is from another Clerk user", () => {
    assert.equal(
      canLoadWorkspaces({
        isSignedIn: true,
        meStatus: "success",
        sessionClerkId: "user_new",
        meClerkId: "user_old",
      }),
      false,
    );
  });

  it("keeps workspaces disabled when clerk ids are missing", () => {
    assert.equal(
      canLoadWorkspaces({
        isSignedIn: true,
        meStatus: "success",
      }),
      false,
    );
    assert.equal(
      canLoadWorkspaces({
        isSignedIn: true,
        meStatus: "success",
        sessionClerkId: "user_a",
        meClerkId: null,
      }),
      false,
    );
  });

  it("enables workspaces only after /me success for the same Clerk user", async () => {
    let meStatus: "pending" | "error" | "success" = "pending";
    assert.equal(
      canLoadWorkspaces({
        isSignedIn: true,
        meStatus,
        sessionClerkId: "user_a",
        meClerkId: "user_a",
      }),
      false,
      "workspaces must not start before /me",
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    meStatus = "success";

    assert.equal(
      canLoadWorkspaces({
        isSignedIn: true,
        meStatus,
        sessionClerkId: "user_a",
        meClerkId: "user_a",
      }),
      true,
      "workspaces may start only after /me bootstrap completes for this session",
    );
  });
});
