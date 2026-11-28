/**
 * App 1.0.8 sends no X-Kangur-App-Version and checks answers with strict schemas. Every
 * answer the server gives without the header goes through the 1.0.8 schemas here, built by
 * the same code the routes use, with the new kinds of data in the database: link
 * invitations, the new notification type, Apple relay addresses, people without a name.
 * The same answers are searched for "privaterelay.appleid.com".
 */
import assert from "node:assert/strict";
import test from "node:test";

import { presentMe } from "@/features/auth/presentMe";
import { MeResponseSchema } from "@/features/auth/schemas";
import { deviceGetsPush } from "@/features/notifications/pushHandler";
import {
  hiddenNotificationTypes,
  presentNotifications,
  type NotificationRow,
} from "@/features/notifications/presentNotifications";
import { NotificationListResponseSchema } from "@/features/notifications/schemas";
import { wrongAccountError } from "@/features/workspace/invitationAccess";
import { differentEmail } from "@/features/workspace/previewInvitation";
import { presentInvitations, type InvitationRow } from "@/features/workspace/presentInvitations";
import {
  LEGACY_HIDDEN_EMAIL,
  presentMembers,
  type MemberRow,
} from "@/features/workspace/presentMembers";
import {
  AcceptInvitationResponseSchema,
  InvitationListResponseSchema,
  InvitationPreviewResponseSchema,
  InviteMemberResultSchema,
  WorkspaceMemberListResponseSchema,
} from "@/features/workspace/schemas";
import { nameWords } from "@/lib/names/words";

import * as app108 from "./app-1.0.8-schemas";

const RELAY = "x7k2m9q4pz@privaterelay.appleid.com";
const OLD = null; // no header: app 1.0.8
const NEW = "1.0.9";
const T0 = new Date("2026-11-12T09:00:00Z");
const T1 = new Date("2026-11-20T09:00:00Z");
const LATER = new Date("2026-12-05T09:00:00Z");

const noRelay = (value: unknown, where: string) =>
  assert.equal(JSON.stringify(value).includes("privaterelay.appleid.com"), false, where);

const members: MemberRow[] = [
  {
    id: "m1",
    userId: "owner",
    role: "owner",
    joinedAt: T0,
    user: { email: "kasia.nowak@gmail.com", displayName: "Kasia", lastNameInitial: "N" },
  },
  {
    id: "m2",
    userId: "apple-hidden",
    role: "member",
    joinedAt: T1,
    user: { email: RELAY, displayName: "Kasia", lastNameInitial: "K" },
  },
  {
    id: "m3",
    userId: "nameless",
    role: "member",
    joinedAt: T1,
    user: { email: "z9q8@privaterelay.appleid.com", displayName: null, lastNameInitial: null },
  },
];

const invitations: InvitationRow[] = [
  { id: "i1", kind: "email", email: "jan@gmail.com", role: "member", status: "pending", expiresAt: LATER, createdAt: T0 },
  { id: "i2", kind: "link", email: null, role: "member", status: "pending", expiresAt: LATER, createdAt: T1 },
];

function notification(over: Partial<NotificationRow>): NotificationRow {
  return {
    id: "n",
    type: "SHOPPING_FINISHED",
    status: "UNREAD",
    title: "Dom Krawców",
    body: "Kasia: zakupy zakończone, 18 z 20 produktów",
    actorUserId: "owner",
    workspaceId: "w1",
    sourceId: "s1",
    payloadType: "SHOPPING",
    payloadSchemaVersion: 1,
    payload: { listId: "l1", actorDisplayName: "Kasia", actorHasName: true },
    createdAt: T1,
    readAt: null,
    ...over,
  };
}

const notifications: NotificationRow[] = [
  notification({ id: "n1" }),
  notification({
    id: "n2",
    type: "WORKSPACE_MEMBER_JOINED",
    payloadType: "WORKSPACE",
    title: "Dom Krawców",
    body: "Nowa osoba: Kasia K.",
    payload: { workspaceId: "w1", memberUserId: "apple-hidden", memberDisplayName: "Kasia K." },
  }),
  notification({
    id: "n3",
    type: "WORKSPACE_INVITATION",
    payloadType: "INVITE",
    title: "Zaproszenie do przestrzeni Dom Krawców",
    body: "Dołącz, aby wspólnie tworzyć listy zakupów.",
    payload: { invitationId: "i1", actorDisplayName: "Domownik", actorHasName: false },
  }),
];

test("members: 1.0.8 parses the list, sees names and never a relay address", () => {
  const body = WorkspaceMemberListResponseSchema.parse({
    members: presentMembers(members, { words: nameWords("pl"), client: OLD }),
  });
  const parsed = app108.WorkspaceMemberListSchema.parse(body);
  assert.deepEqual(
    parsed.members.map((m) => m.displayName),
    ["Kasia N.", "Kasia K.", "Domownik"],
  );
  assert.equal(parsed.members[1]!.email, LEGACY_HIDDEN_EMAIL);
  assert.equal(parsed.members[0]!.email, "kasia.nowak@gmail.com");
  noRelay(body, "members for 1.0.8");
});

test("members: 1.0.9 gets null for a hidden address", () => {
  const body = WorkspaceMemberListResponseSchema.parse({
    members: presentMembers(members, { words: nameWords("en"), client: NEW }),
  });
  assert.equal(body.members[1]!.email, null);
  assert.equal(body.members[2]!.displayName, "Household member");
  assert.equal(body.members[2]!.hasName, false);
  noRelay(body, "members for 1.0.9");
});

test("invitations: 1.0.8 gets only e-mail ones, a link would break its list", () => {
  const legacy = InvitationListResponseSchema.parse({
    invitations: presentInvitations(invitations, OLD),
  });
  assert.deepEqual(app108.InvitationListSchema.parse(legacy).invitations.map((i) => i.id), ["i1"]);

  const current = InvitationListResponseSchema.parse({
    invitations: presentInvitations(invitations, NEW),
  });
  assert.deepEqual(current.invitations.map((i) => i.kind), ["email", "link"]);
  // Why the gate exists: the 1.0.8 schema refuses an invitation without an address.
  assert.equal(app108.InvitationListSchema.safeParse(current).success, false);
});

test("notifications: 1.0.8 never sees the new type, nor counts it", () => {
  assert.deepEqual(hiddenNotificationTypes(OLD), ["WORKSPACE_MEMBER_JOINED"]);
  assert.deepEqual(hiddenNotificationTypes(NEW), []);

  const legacy = NotificationListResponseSchema.parse({
    unreadCount: 2,
    notifications: presentNotifications(notifications, OLD),
  });
  const parsed = app108.NotificationListSchema.parse(legacy);
  assert.deepEqual(parsed.notifications.map((n) => n.id), ["n1", "n3"]);

  const current = NotificationListResponseSchema.parse({
    unreadCount: 3,
    notifications: presentNotifications(notifications, NEW),
  });
  assert.equal(current.notifications.length, 3);
  assert.equal(app108.NotificationListSchema.safeParse(current).success, false);
  noRelay(current, "notifications");
});

test("push about a new member goes only to devices with 1.0.9", () => {
  assert.equal(deviceGetsPush("WORKSPACE_MEMBER_JOINED", "1.0.8"), false);
  assert.equal(deviceGetsPush("WORKSPACE_MEMBER_JOINED", null), false);
  assert.equal(deviceGetsPush("WORKSPACE_MEMBER_JOINED", "1.0.9"), true);
  assert.equal(deviceGetsPush("SHOPPING_FINISHED", "1.0.8"), true);
  assert.equal(deviceGetsPush("SHOPPING_FINISHED", null), true);
});

test("me: new fields do not disturb 1.0.8", () => {
  const body = presentMe({
    id: "u1",
    clerkId: "user_1",
    email: RELAY,
    locale: "pl",
    platformRole: "USER",
    displayName: "Kasia",
    createdAt: T0,
    updatedAt: T1,
  });
  assert.equal(MeResponseSchema.parse(body).emailHidden, true);
  const parsed = app108.MeSchema.parse(body);
  assert.equal(parsed.locale, "pl");
});

test("preview, accept and invite answers still fit 1.0.8", () => {
  const preview = InvitationPreviewResponseSchema.parse({
    invitationId: "i2",
    kind: "link",
    createdAt: T1.toISOString(),
    inviterDisplayName: "Kasia N.",
    inviterHasName: true,
    differentEmail: differentEmail("kasia@gmail.com", RELAY),
    workspace: { id: "w1", name: "Dom Krawców", icon: "home" },
    memberCount: 3,
    members: presentMembers(members, { words: nameWords("pl"), client: OLD }).map((m) => ({
      userId: m.userId,
      displayName: m.displayName,
    })),
    alreadyMember: false,
  });
  app108.InvitationPreviewSchema.parse(preview);
  assert.equal(preview.differentEmail, null);
  noRelay(preview, "preview");

  app108.AcceptInvitationResultSchema.parse(
    AcceptInvitationResponseSchema.parse({
      workspace: { id: "w1", name: "Dom Krawców", icon: "home" },
      role: "member",
      alreadyMember: false,
    }),
  );
  app108.InviteMemberResultSchema.parse(
    InviteMemberResultSchema.parse({
      status: "created",
      invitation: { id: "i1", email: "jan@gmail.com", role: "member", expiresAt: LATER.toISOString() },
      emailDelivered: true,
    }),
  );
});

test("a different real address is shown, a hidden one never", () => {
  assert.deepEqual(differentEmail("Kasia@gmail.com", "jan@gmail.com"), {
    invitedEmail: "kasia@gmail.com",
    accountEmail: "jan@gmail.com",
  });
  assert.equal(differentEmail("kasia@gmail.com", "kasia@gmail.com"), null);
  assert.equal(differentEmail(null, "jan@gmail.com"), null);
  assert.equal(differentEmail("kasia@gmail.com", RELAY), null);
});

test("errors: the refusal for an id from a notification has no relay address", () => {
  const error = wrongAccountError({ email: RELAY, provider: "apple" }).toJSON();
  noRelay(error, "email_mismatch");
  // App 1.0.8 builds "you are signed in as …" from currentEmail: it gets words, not a blank.
  const currentEmail = error.details?.currentEmail;
  assert.equal(typeof currentEmail, "string");
  assert.ok(String(currentEmail).length > 0);
});
