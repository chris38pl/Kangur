import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/authorize";

import type { WorkspaceMemberDTO } from "./schemas";

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() || email;
  if (!local) return email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export async function listWorkspaceMembers(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMemberDTO[]> {
  await authorize(workspaceId, userId);

  const rows = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, email: true } } },
  });

  // owner → admin → member (Prisma enum order matches)
  const roleRank: Record<string, number> = {
    owner: 0,
    admin: 1,
    member: 2,
  };

  return rows
    .slice()
    .sort(
      (a, b) =>
        (roleRank[a.role] ?? 9) - (roleRank[b.role] ?? 9) ||
        a.joinedAt.getTime() - b.joinedAt.getTime(),
    )
    .map((row) => ({
      id: row.id,
      userId: row.userId,
      email: row.user.email,
      displayName: displayNameFromEmail(row.user.email),
      role: row.role,
      joinedAt: row.joinedAt.toISOString(),
    }));
}
