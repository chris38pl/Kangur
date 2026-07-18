import { notFound, forbidden } from "@/lib/auth/errors";
import { displayNameFromEmail } from "@/lib/displayName";
import { normalizeEmail } from "@/lib/email/normalizeEmail";
import { hashInviteToken } from "@/lib/invite/token";
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

/**
 * Preview for invitees (by token). Does not require workspace membership.
 */
export async function previewInvitation(input: {
  rawToken: string;
  userId: string;
  userEmail: string;
}): Promise<InvitationPreview> {
  const token = input.rawToken?.trim();
  if (!token) {
    throw notFound("Invitation expired.", { reason: "expired" });
  }

  const tokenHash = hashInviteToken(token);
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash },
    include: {
      workspace: true,
      invitedBy: true,
    },
  });

  if (!invitation) {
    throw notFound("Invitation expired.", { reason: "expired" });
  }

  if (invitation.status === "revoked") {
    throw notFound("Invitation expired.", { reason: "revoked" });
  }

  if (invitation.status === "pending" && invitation.expiresAt < new Date()) {
    throw notFound("Invitation expired.", { reason: "expired" });
  }

  if (normalizeEmail(invitation.email) !== normalizeEmail(input.userEmail)) {
    throw forbidden("Invitation belongs to a different email.", {
      reason: "email_mismatch",
      invitationEmail: invitation.email,
      currentEmail: input.userEmail,
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
