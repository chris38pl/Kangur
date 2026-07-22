import type { WorkspaceRole } from "@prisma/client";
import { Prisma } from "@prisma/client";

import {
  conflict,
  forbidden,
  notFound,
  validationError,
} from "@/lib/auth/errors";
import {
  resolveAuthProvider,
  type AuthProvider,
} from "@/lib/auth/resolveAuthProvider";
import { normalizeEmail } from "@/lib/email/normalizeEmail";
import { hashInviteToken } from "@/lib/invite/token";
import { prisma } from "@/lib/prisma";

export type AcceptInvitationResult = {
  workspace: {
    id: string;
    name: string;
    icon: string;
  };
  role: WorkspaceRole;
  alreadyMember: boolean;
};

export type AcceptInvitationInput = {
  rawToken: string;
  userId: string;
  userEmail: string;
  clerkId: string;
};

export type { AuthProvider };

export async function acceptInvitation(
  input: AcceptInvitationInput,
): Promise<AcceptInvitationResult> {
  const token = input.rawToken?.trim();
  if (!token) {
    throw notFound("Invitation expired.", { reason: "expired" });
  }

  const tokenHash = hashInviteToken(token);
  const userEmail = normalizeEmail(input.userEmail);
  const provider = await resolveAuthProvider(input.clerkId);

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const invitation = await tx.invitation.findUnique({
          where: { tokenHash },
          include: { workspace: true },
        });

        if (!invitation) {
          throw notFound("Invitation expired.", { reason: "expired" });
        }

        if (invitation.status === "accepted") {
          const existing = await tx.workspaceMember.findUnique({
            where: {
              workspaceId_userId: {
                workspaceId: invitation.workspaceId,
                userId: input.userId,
              },
            },
          });
          if (existing) {
            return {
              workspace: {
                id: invitation.workspace.id,
                name: invitation.workspace.name,
                icon: invitation.workspace.icon,
              },
              role: existing.role,
              alreadyMember: true,
            };
          }
          throw conflict("Invitation already accepted.", {
            reason: "already_accepted",
            workspaceId: invitation.workspace.id,
            workspaceName: invitation.workspace.name,
            workspaceIcon: invitation.workspace.icon,
          });
        }

        if (invitation.status === "revoked") {
          throw notFound("Invitation expired.", { reason: "revoked" });
        }

        const now = new Date();
        if (invitation.expiresAt < now) {
          await tx.invitation.updateMany({
            where: { id: invitation.id, status: "pending" },
            data: { status: "revoked" },
          });
          throw notFound("Invitation expired.", { reason: "expired" });
        }

        if (normalizeEmail(invitation.email) !== userEmail) {
          throw forbidden("Invitation belongs to a different email.", {
            reason: "email_mismatch",
            invitationEmail: invitation.email,
            currentEmail: userEmail,
            provider,
          });
        }

        const existingMembership = await tx.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: invitation.workspaceId,
              userId: input.userId,
            },
          },
        });

        if (existingMembership) {
          await tx.invitation.updateMany({
            where: { id: invitation.id, status: "pending" },
            data: { status: "accepted", acceptedAt: now },
          });
          return {
            workspace: {
              id: invitation.workspace.id,
              name: invitation.workspace.name,
              icon: invitation.workspace.icon,
            },
            role: existingMembership.role,
            alreadyMember: true,
          };
        }

        const accepted = await tx.invitation.updateMany({
          where: {
            id: invitation.id,
            status: "pending",
            expiresAt: { gte: now },
          },
          data: {
            status: "accepted",
            acceptedAt: now,
          },
        });

        if (accepted.count === 0) {
          throw notFound("Invitation expired.", { reason: "revoked" });
        }

        await tx.workspaceMember.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: input.userId,
            role: invitation.role === "owner" ? "member" : invitation.role,
          },
        });

        console.info("[invite]", "INVITE_ACCEPTED", {
          invitationId: invitation.id,
          workspaceId: invitation.workspaceId,
          userId: input.userId,
        });

        return {
          workspace: {
            id: invitation.workspace.id,
            name: invitation.workspace.name,
            icon: invitation.workspace.icon,
          },
          role: invitation.role === "owner" ? "member" : invitation.role,
          alreadyMember: false as const,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    if (!result.alreadyMember) {
      const { Analytics } = await import("@/lib/analytics");
      Analytics.track(
        "invitation_accepted",
        { workspace_id: result.workspace.id },
        input.userId,
      );
    }

    return result;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const invitation = await prisma.invitation.findUnique({
        where: { tokenHash },
        include: { workspace: true },
      });
      throw conflict("You already belong to this workspace.", {
        reason: "already_member",
        workspaceId: invitation?.workspaceId,
        workspaceName: invitation?.workspace.name,
        workspaceIcon: invitation?.workspace.icon,
      });
    }
    throw error;
  }
}
