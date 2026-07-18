import { authorize, requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

import type { InvitationDTO } from "./schemas";

export async function listInvitations(
  workspaceId: string,
  userId: string,
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

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }));
}
