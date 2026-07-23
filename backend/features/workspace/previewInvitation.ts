import { notFound, forbidden, validationError } from "@/lib/auth/errors";
import { resolveAuthProvider } from "@/lib/auth/resolveAuthProvider";
import { displayNameFromEmail } from "@/lib/displayName";
import { normalizeEmail } from "@/lib/email/normalizeEmail";
import {
  hashInviteToken,
  isValidInviteRawToken,
} from "@/lib/invite/token";
import { prisma } from "@/lib/prisma";

export type InvitationPreview = {
  invitationId: string;
  createdAt: string;
  inviterDisplayName: string;
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

const invitationInclude = {
  workspace: true,
  invitedBy: true,
} as const;

async function loadInvitation(input: {
  rawToken?: string;
  invitationId?: string;
}) {
  if (input.rawToken) {
    const token = input.rawToken.trim();
    if (!isValidInviteRawToken(token)) {
      throw notFound("Invitation expired.", { reason: "expired" });
    }
    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash: hashInviteToken(token) },
      include: invitationInclude,
    });
    if (!invitation) {
      throw notFound("Invitation expired.", { reason: "expired" });
    }
    return invitation;
  }

  if (input.invitationId) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: input.invitationId.trim() },
      include: invitationInclude,
    });
    if (!invitation) {
      throw notFound("Invitation expired.", { reason: "expired" });
    }
    return invitation;
  }

  throw validationError("Provide exactly one of token or invitationId.");
}

/**
 * Preview for invitees (by deep-link token or invitationId from in-app notification).
 * Does not require workspace membership.
 */
export async function previewInvitation(input: {
  rawToken?: string;
  invitationId?: string;
  userId: string;
  userEmail: string;
  clerkId: string;
}): Promise<InvitationPreview> {
  const invitation = await loadInvitation({
    rawToken: input.rawToken,
    invitationId: input.invitationId,
  });

  if (invitation.status === "revoked") {
    throw notFound("Invitation expired.", { reason: "revoked" });
  }

  if (invitation.status === "pending" && invitation.expiresAt < new Date()) {
    throw notFound("Invitation expired.", { reason: "expired" });
  }

  if (normalizeEmail(invitation.email) !== normalizeEmail(input.userEmail)) {
    const provider = await resolveAuthProvider(input.clerkId);
    throw forbidden("Invitation belongs to a different email.", {
      reason: "email_mismatch",
      currentEmail: input.userEmail,
      provider,
    });
  }

  const [members, memberCount, membership] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId: invitation.workspaceId },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
      take: 8,
    }),
    prisma.workspaceMember.count({
      where: { workspaceId: invitation.workspaceId },
    }),
    prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: input.userId,
        },
      },
    }),
  ]);

  return {
    invitationId: invitation.id,
    createdAt: invitation.createdAt.toISOString(),
    inviterDisplayName: displayNameFromEmail(invitation.invitedBy.email),
    workspace: {
      id: invitation.workspace.id,
      name: invitation.workspace.name,
      icon: invitation.workspace.icon,
    },
    memberCount,
    members: members.map((m) => ({
      userId: m.userId,
      displayName: displayNameFromEmail(m.user.email),
    })),
    alreadyMember: Boolean(membership) || invitation.status === "accepted",
  };
}
