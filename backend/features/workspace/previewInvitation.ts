import type { InvitationKind } from "@prisma/client";

import type { ClientVersion } from "@/lib/clientVersion";
import { normalizeEmail } from "@/lib/email/normalizeEmail";
import { resolveAppLocale } from "@/lib/locale";
import {
  isPrivateRelayEmail,
  resolveDisplayName,
} from "@/lib/names/displayName";
import { nameWords } from "@/lib/names/words";
import { prisma } from "@/lib/prisma";

import {
  invitationGate,
  invitationGoneError,
  needsAddressCheck,
  wrongAccountError,
} from "./invitationAccess";
import {
  accountOwnsAddress,
  capabilityOf,
  defaultInvitationDeps,
  findInvitation,
  type InvitationCapability,
  type InvitationDeps,
} from "./invitationDeps";
import { MEMBER_USER_SELECT } from "./listWorkspaceMembers";
import { memberLabels, sortMembers } from "./presentMembers";

/** Avatars on the "Join" screen. */
const PREVIEW_MEMBERS = 8;

export type InvitationPreview = {
  invitationId: string;
  kind: InvitationKind;
  createdAt: string;
  inviterDisplayName: string;
  inviterHasName: boolean;
  differentEmail: { invitedEmail: string; accountEmail: string } | null;
  workspace: {
    id: string;
    name: string;
    icon: string;
  };
  memberCount: number;
  members: Array<{
    userId: string;
    displayName: string;
  }>;
  alreadyMember: boolean;
};

export type InvitationViewer = {
  id: string;
  email: string;
  locale: string | null;
  clerkId: string;
};

/**
 * "Kasia invites you to Dom Krawców" for the person holding the invitation, before they
 * join. Does not require workspace membership. A used link opened by someone else is gone
 * ("used"), not "you are already here".
 */
export async function previewInvitation(
  input: InvitationCapability & {
    viewer: InvitationViewer;
    /** The asking app (lib/clientVersion.ts); missing means app 1.0.8. */
    client?: ClientVersion;
  },
  deps: InvitationDeps = defaultInvitationDeps,
): Promise<InvitationPreview> {
  const { via, where } = capabilityOf(input);
  const invitation = await findInvitation(prisma, where, {
    workspace: true,
    invitedBy: { select: MEMBER_USER_SELECT },
  });

  const viewer = input.viewer;
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: invitation.workspaceId,
        userId: viewer.id,
      },
    },
  });

  const gate = invitationGate({
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    isMember: Boolean(membership),
    now: deps.now(),
  });
  if (gate.kind === "gone") throw invitationGoneError(gate.reason);

  if (
    gate.kind === "open" &&
    needsAddressCheck(via) &&
    !(await accountOwnsAddress(invitation.email, viewer, deps))
  ) {
    throw wrongAccountError({
      email: viewer.email,
      provider: await deps.authProvider(viewer.clerkId),
      client: input.client,
      locale: viewer.locale,
    });
  }

  const rows = await prisma.workspaceMember.findMany({
    where: { workspaceId: invitation.workspaceId },
    include: { user: { select: MEMBER_USER_SELECT } },
  });
  const words = nameWords(resolveAppLocale(viewer.locale));
  const labels = memberLabels(rows, words);
  const inviterName = resolveDisplayName(invitation.invitedBy);

  return {
    invitationId: invitation.id,
    kind: invitation.kind,
    createdAt: invitation.createdAt.toISOString(),
    inviterDisplayName:
      labels.get(invitation.invitedByUserId) ?? inviterName ?? words.fallback,
    inviterHasName: inviterName !== null,
    differentEmail: await differentAccountEmail(invitation.email, viewer, deps),
    workspace: {
      id: invitation.workspace.id,
      name: invitation.workspace.name,
      icon: invitation.workspace.icon,
    },
    memberCount: rows.length,
    members: sortMembers(rows)
      .slice(0, PREVIEW_MEMBERS)
      .map((row) => ({
        userId: row.userId,
        displayName: labels.get(row.userId) ?? words.fallback,
      })),
    alreadyMember: gate.kind === "already_member",
  };
}

/**
 * The line about another address, only when the invited address is not this account's at
 * all: neither its Kangur address nor an extra one verified in Clerk. Clerk is asked only
 * when the line would otherwise show.
 */
async function differentAccountEmail(
  invitedEmail: string | null,
  viewer: InvitationViewer,
  deps: InvitationDeps,
): Promise<InvitationPreview["differentEmail"]> {
  const line = differentEmail(invitedEmail, viewer.email);
  if (!line) return null;
  return (await accountOwnsAddress(invitedEmail, viewer, deps)) ? null : line;
}

/**
 * "The invitation was for kasia@gmail.com. You will join as jan@gmail.com." Only when both
 * are real addresses: an account whose address Apple hides sees no such line.
 */
export function differentEmail(
  invitedEmail: string | null,
  accountEmail: string,
): InvitationPreview["differentEmail"] {
  if (!invitedEmail) return null;
  if (isPrivateRelayEmail(invitedEmail) || isPrivateRelayEmail(accountEmail)) return null;
  if (normalizeEmail(invitedEmail) === normalizeEmail(accountEmail)) return null;
  return { invitedEmail: normalizeEmail(invitedEmail), accountEmail: normalizeEmail(accountEmail) };
}
