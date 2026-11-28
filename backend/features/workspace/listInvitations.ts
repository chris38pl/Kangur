import { authorize, requireRole } from "@/lib/authorize";
import type { ClientVersion } from "@/lib/clientVersion";
import { prisma } from "@/lib/prisma";

import { presentInvitations } from "./presentInvitations";
import type { InvitationDTO } from "./schemas";

export async function listInvitations(
  workspaceId: string,
  userId: string,
  client: ClientVersion,
): Promise<InvitationDTO[]> {
  const { membership } = await authorize(workspaceId, userId);
  requireRole(
    membership,
    ["owner", "admin"],
    "Only owners and admins can list invitations.",
  );

  const now = new Date();

  await prisma.invitation.updateMany({
    where: {
      workspaceId,
      status: "pending",
      expiresAt: { lt: now },
    },
    data: { status: "revoked" },
  });

  const rows = await prisma.invitation.findMany({
    where: {
      workspaceId,
      status: "pending",
      expiresAt: { gte: now },
    },
    orderBy: { createdAt: "desc" },
  });

  return presentInvitations(rows, client);
}
