/**
 * Invitations against a real Postgres: one-time links, addresses, two people at once.
 * Runs only with KANGUR_DB_TESTS=1 and a DATABASE_URL of a throwaway branch (Neon
 * `development`), never production. Makes its own users and workspace and deletes them.
 *
 *   KANGUR_DB_TESTS=1 DATABASE_URL=… DIRECT_URL=… pnpm test:invites:db
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import type { User } from "@prisma/client";

import { acceptInvitation } from "@/features/workspace/acceptInvitation";
import type { InvitationDeps } from "@/features/workspace/invitationDeps";
import { previewInvitation } from "@/features/workspace/previewInvitation";
import { ApiError } from "@/lib/auth/errors";
import { generateInviteRawToken, hashInviteToken } from "@/lib/invite/token";
import { prisma } from "@/lib/prisma";

const PRODUCTION_ENDPOINT = "ep-bold-hill-aswcl1ei";
const enabled =
  process.env.KANGUR_DB_TESTS === "1" &&
  Boolean(process.env.DATABASE_URL) &&
  !process.env.DATABASE_URL!.includes(PRODUCTION_ENDPOINT);

const RUN = randomUUID().slice(0, 8);
const DAY = 24 * 60 * 60 * 1000;
const verified = new Map<string, string[]>();

const deps: InvitationDeps = {
  directory: {
    verifiedEmails: async (clerkId) => verified.get(clerkId) ?? [],
    usersWithVerifiedEmail: async () => [],
  },
  authProvider: async () => "apple",
  now: () => new Date(),
};

let workspaceId = "";
const users: User[] = [];

async function makeUser(label: string, email: string, displayName: string | null): Promise<User> {
  const user = await prisma.user.create({
    data: {
      clerkId: `test_${RUN}_${label}`,
      email,
      locale: "pl",
      displayName,
      displayNameSource: displayName ? "provider" : null,
    },
  });
  users.push(user);
  return user;
}

const viewer = (user: User) => ({
  id: user.id,
  email: user.email,
  locale: user.locale,
  clerkId: user.clerkId,
});

async function makeInvitation(input: {
  kind: "email" | "link";
  email?: string;
  expiresInMs?: number;
  status?: "pending" | "revoked";
}) {
  const rawToken = generateInviteRawToken();
  const invitation = await prisma.invitation.create({
    data: {
      workspaceId,
      kind: input.kind,
      email: input.email ?? null,
      role: "member",
      tokenHash: hashInviteToken(rawToken),
      status: input.status ?? "pending",
      expiresAt: new Date(Date.now() + (input.expiresInMs ?? 7 * DAY)),
      invitedByUserId: users[0]!.id,
    },
  });
  return { rawToken, invitation };
}

async function reasonOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return `${error.status} ${String(error.details?.reason)}`;
    throw error;
  }
  return "ok";
}

const isMember = async (userId: string) =>
  Boolean(
    await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    }),
  );

before(async () => {
  if (!enabled) return;
  const owner = await makeUser("owner", `owner.${RUN}@example.com`, "Ada");
  const workspace = await prisma.workspace.create({
    data: {
      name: `Test ${RUN}`,
      icon: "home",
      createdByUserId: owner.id,
      members: { create: { userId: owner.id, role: "owner" } },
    },
  });
  workspaceId = workspace.id;
});

after(async () => {
  if (!enabled) return;
  await prisma.workspace.deleteMany({ where: { id: workspaceId } });
  await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
  await prisma.$disconnect();
});

test("a valid link: the holder joins, whatever their address", { skip: !enabled }, async () => {
  const hidden = await makeUser("hidden", `x${RUN}@privaterelay.appleid.com`, "Kasia");
  const { rawToken } = await makeInvitation({ kind: "link" });

  const preview = await previewInvitation({ rawToken, viewer: viewer(hidden) }, deps);
  assert.equal(preview.inviterDisplayName, "Ada");
  assert.equal(preview.kind, "link");
  assert.equal(preview.alreadyMember, false);
  assert.equal(JSON.stringify(preview).includes("privaterelay"), false);

  const result = await acceptInvitation({ rawToken, viewer: viewer(hidden) }, deps);
  assert.equal(result.alreadyMember, false);
  assert.equal(await isMember(hidden.id), true);

  // The inviter hears about it, without a gender and without the relay address.
  const notice = await prisma.notification.findFirst({
    where: { recipientUserId: users[0]!.id, type: "WORKSPACE_MEMBER_JOINED", actorUserId: hidden.id },
  });
  assert.ok(notice);
  assert.equal(notice.title, `Test ${RUN}`);
  assert.equal(notice.body, "Nowa osoba: Kasia");
  assert.equal(JSON.stringify(notice).includes("privaterelay"), false);

  // A used link for someone else: gone, not "you are already here".
  const other = await makeUser("other", `other.${RUN}@example.com`, "Jan");
  assert.equal(await reasonOf(previewInvitation({ rawToken, viewer: viewer(other) }, deps)), "404 used");
  assert.equal(await reasonOf(acceptInvitation({ rawToken, viewer: viewer(other) }, deps)), "404 used");
  assert.equal(await isMember(other.id), false);

  // The one who used it sees "already here".
  const again = await previewInvitation({ rawToken, viewer: viewer(hidden) }, deps);
  assert.equal(again.alreadyMember, true);
});

test("expired and revoked links are gone", { skip: !enabled }, async () => {
  const someone = await makeUser("late", `late.${RUN}@example.com`, null);
  const expired = await makeInvitation({ kind: "link", expiresInMs: -DAY });
  const revoked = await makeInvitation({ kind: "link", status: "revoked" });
  assert.equal(
    await reasonOf(acceptInvitation({ rawToken: expired.rawToken, viewer: viewer(someone) }, deps)),
    "404 expired",
  );
  assert.equal(
    await reasonOf(previewInvitation({ rawToken: revoked.rawToken, viewer: viewer(someone) }, deps)),
    "404 revoked",
  );
  assert.equal(await isMember(someone.id), false);
});

test("an e-mail link opened with another address joins", { skip: !enabled }, async () => {
  const wife = await makeUser("wife", `w${RUN}@privaterelay.appleid.com`, "Ola");
  const { rawToken } = await makeInvitation({ kind: "email", email: `ola.${RUN}@gmail.com` });
  const preview = await previewInvitation({ rawToken, viewer: viewer(wife) }, deps);
  // Hidden by Apple: no "the invitation was for…" line.
  assert.equal(preview.differentEmail, null);
  const result = await acceptInvitation({ rawToken, viewer: viewer(wife) }, deps);
  assert.equal(result.alreadyMember, false);
  assert.equal(await isMember(wife.id), true);
});

test("by id: another address is refused, a verified one in Clerk joins", { skip: !enabled }, async () => {
  const invited = `kasia.${RUN}@gmail.com`;
  const { invitation } = await makeInvitation({ kind: "email", email: invited });

  const stranger = await makeUser("stranger", `jan.${RUN}@gmail.com`, "Jan");
  verified.set(stranger.clerkId, [stranger.email]);
  assert.equal(
    await reasonOf(acceptInvitation({ invitationId: invitation.id, viewer: viewer(stranger) }, deps)),
    "403 email_mismatch",
  );
  assert.equal(await isMember(stranger.id), false);

  const hiddenOwner = await makeUser("kasia", `k${RUN}@privaterelay.appleid.com`, "Kasia");
  verified.set(hiddenOwner.clerkId, [hiddenOwner.email, invited]);
  try {
    await previewInvitation({ invitationId: invitation.id, viewer: viewer(stranger) }, deps);
    assert.fail("expected a refusal");
  } catch (error) {
    assert.ok(error instanceof ApiError);
    assert.equal(JSON.stringify(error.toJSON()).includes("privaterelay"), false);
  }
  const result = await acceptInvitation({ invitationId: invitation.id, viewer: viewer(hiddenOwner) }, deps);
  assert.equal(result.alreadyMember, false);
  assert.equal(await isMember(hiddenOwner.id), true);
});

test("two people with one link at the same moment: one gets in", { skip: !enabled }, async () => {
  const first = await makeUser("first", `first.${RUN}@example.com`, "Ewa");
  const second = await makeUser("second", `second.${RUN}@example.com`, "Piotr");
  const { rawToken, invitation } = await makeInvitation({ kind: "link" });

  const outcomes = await Promise.all([
    reasonOf(acceptInvitation({ rawToken, viewer: viewer(first) }, deps)),
    reasonOf(acceptInvitation({ rawToken, viewer: viewer(second) }, deps)),
  ]);
  assert.deepEqual([...outcomes].sort(), ["404 used", "ok"]);
  const joined = [await isMember(first.id), await isMember(second.id)].filter(Boolean);
  assert.equal(joined.length, 1);
  const row = await prisma.invitation.findUniqueOrThrow({ where: { id: invitation.id } });
  assert.equal(row.status, "accepted");
});

test("a member opening a pending link does not use it up", { skip: !enabled }, async () => {
  const { rawToken, invitation } = await makeInvitation({ kind: "link" });
  const owner = users[0]!;
  const result = await acceptInvitation({ rawToken, viewer: viewer(owner) }, deps);
  assert.equal(result.alreadyMember, true);
  const row = await prisma.invitation.findUniqueOrThrow({ where: { id: invitation.id } });
  assert.equal(row.status, "pending");
});
