/**
 * App 1.0.9 reads answers of a server that may be newer: an unknown notification type, an
 * invitation without an address or a new role must not break a whole list, as one did in
 * app 1.0.8.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { nameProblem, savableName } from "@/features/profile/display-name";
import { NotificationListSchema } from "@/features/notifications/schemas";
import {
  InvitationListSchema,
  InvitationPreviewSchema,
  WorkspaceMemberListSchema,
} from "@/features/workspace/schemas";

const notification = (type: string, id: string) => ({
  id,
  type,
  status: "UNREAD",
  title: "Dom Krawców",
  body: "Nowa osoba: Kasia",
  actorUserId: null,
  workspaceId: "w1",
  sourceId: null,
  payloadType: "WORKSPACE",
  payloadSchemaVersion: 1,
  payload: {},
  createdAt: "2026-11-28T10:00:00.000Z",
  readAt: null,
});

describe("lists from a newer server", () => {
  it("keeps notifications of types it does not know, drops only broken rows", () => {
    const parsed = NotificationListSchema.parse({
      unreadCount: 3,
      notifications: [
        notification("WORKSPACE_MEMBER_JOINED", "n1"),
        notification("SOMETHING_FROM_2027", "n2"),
        { id: "broken" },
      ],
    });
    assert.deepEqual(parsed.notifications.map((n) => n.id), ["n1", "n2"]);
  });

  it("reads link invitations and members without an address", () => {
    const invitations = InvitationListSchema.parse({
      invitations: [
        { id: "i1", kind: "link", email: null, role: "member", status: "pending", expiresAt: "x", createdAt: "x" },
        { id: "i2", kind: "group", email: "jan@gmail.com", role: "guest", status: "pending", expiresAt: "x", createdAt: "x" },
        { id: "i3", email: "ola@gmail.com", role: "member", status: "pending", expiresAt: "x", createdAt: "x" },
      ],
    });
    assert.deepEqual(invitations.invitations.map((i) => [i.id, i.kind, i.role]), [
      ["i1", "link", "member"],
      ["i2", "email", "member"],
      ["i3", "email", "member"],
    ]);

    const members = WorkspaceMemberListSchema.parse({
      members: [
        { id: "m1", userId: "u1", email: null, displayName: "Domownik", hasName: false, role: "member", joinedAt: "x" },
        { id: "m2", userId: "u2", displayName: "Kasia", role: "owner", joinedAt: "x" },
      ],
    });
    assert.equal(members.members[0]!.hasName, false);
    assert.equal(members.members[1]!.hasName, true);
  });

  it("reads a preview from the server before 1.0.9 too", () => {
    const preview = InvitationPreviewSchema.parse({
      invitationId: "i1",
      createdAt: "x",
      inviterDisplayName: "Kasia",
      workspace: { id: "w1", name: "Dom", icon: "home" },
      memberCount: 1,
      members: [{ userId: "u1", displayName: "Kasia" }],
      alreadyMember: false,
    });
    assert.equal(preview.kind, "email");
    assert.equal(preview.inviterHasName, true);
    assert.equal(preview.differentEmail, null);
  });
});

describe("the name field", () => {
  it("takes a name, skips empty, refuses an address or a long one", () => {
    assert.equal(savableName("  Kasia  "), "Kasia");
    assert.equal(savableName(""), null);
    assert.equal(nameProblem(""), null);
    assert.equal(nameProblem("kasia@gmail.com"), "email");
    assert.equal(nameProblem("x".repeat(31)), "too_long");
    assert.equal(savableName("kasia@gmail.com"), null);
  });
});
