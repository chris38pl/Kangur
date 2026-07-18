import { notFound } from "@/lib/auth/errors";
import { authorize, requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

export async function revokeInvitation(
  workspaceId: string,
  invitationId: string,
  userId: string,
): Promise<void> {
  const { membership } = await authorize(workspaceId, userId);
  requireRole(
    membership,
    ["owner", "admin"],
    "Only owners and admins can revoke invitations.",
  );

  await prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findFirst({
      where: { id: invitationId, workspaceId },
    });

    if (!invitation) {
      throw notFound("Invitation not found.");
    }

    if (invitation.status !== "pending") {
      throw notFound("Invitation not found.");
    }

    const result = await tx.invitation.updateMany({
      where: {
        id: invitationId,
        workspaceId,
        status: "pending",
      },
      data: { status: "revoked" },
    });

    if (result.count === 0) {
      throw notFound("Invitation not found.");
    }
  });

  console.info("[invite]", "INVITE_REVOKED", {
    invitationId,
    workspaceId,
  });
}
