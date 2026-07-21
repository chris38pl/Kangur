import type { Prisma, WorkspaceMember, WorkspaceRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

type MemberRow = Pick<WorkspaceMember, "id" | "userId" | "role" | "joinedAt">;

const ROLE_PRIORITY: WorkspaceRole[] = ["owner", "admin", "member"];

/**
 * Deterministic successor among remaining members:
 * oldest owner → oldest admin → oldest member
 * (joinedAt ASC, then id ASC).
 */
export function pickOwnershipSuccessor(
  remaining: MemberRow[],
): MemberRow | null {
  if (remaining.length === 0) return null;

  for (const role of ROLE_PRIORITY) {
    const inRole = remaining
      .filter((m) => m.role === role)
      .sort((a, b) => {
        const byJoined = a.joinedAt.getTime() - b.joinedAt.getTime();
        if (byJoined !== 0) return byJoined;
        return a.id.localeCompare(b.id);
      });
    if (inRole[0]) return inRole[0];
  }

  return null;
}

async function transferWorkspaceAwayFromUser(
  tx: Tx,
  workspaceId: string,
  deletedUserId: string,
  remaining: MemberRow[],
): Promise<void> {
  const successor = pickOwnershipSuccessor(remaining);
  if (!successor) {
    // Sole member - cascade deletes lists/items/etc.
    await tx.workspace.delete({ where: { id: workspaceId } });
    return;
  }

  // Update existing membership in place (admin/member → owner). Never create a new row.
  if (successor.role !== "owner") {
    await tx.workspaceMember.update({
      where: { id: successor.id },
      data: { role: "owner" },
    });
  }

  const workspace = await tx.workspace.findUnique({
    where: { id: workspaceId },
    select: { createdByUserId: true },
  });

  if (workspace?.createdByUserId === deletedUserId) {
    await tx.workspace.update({
      where: { id: workspaceId },
      data: { createdByUserId: successor.userId },
    });
  }

  // Same successor for every list created by the deleted user in this workspace.
  await tx.shoppingList.updateMany({
    where: {
      workspaceId,
      createdByUserId: deletedUserId,
    },
    data: { createdByUserId: successor.userId },
  });

  await tx.workspaceMember.deleteMany({
    where: { workspaceId, userId: deletedUserId },
  });
}

/**
 * Purge app-domain data for a user. DB-only - no Clerk calls.
 * Idempotent: missing user / membership / workspace → no-op success.
 */
export async function deleteMe(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const memberships = await tx.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    });

    for (const { workspaceId } of memberships) {
      const workspace = await tx.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true },
      });
      if (!workspace) continue;

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId },
        select: { id: true, userId: true, role: true, joinedAt: true },
      });

      const remaining = members.filter((m) => m.userId !== userId);
      await transferWorkspaceAwayFromUser(tx, workspaceId, userId, remaining);
    }

    // Lists created by this user outside memberships we already handled (edge case).
    const leftoverLists = await tx.shoppingList.findMany({
      where: { createdByUserId: userId },
      select: { id: true, workspaceId: true },
    });

    for (const list of leftoverLists) {
      const members = await tx.workspaceMember.findMany({
        where: { workspaceId: list.workspaceId },
        select: { id: true, userId: true, role: true, joinedAt: true },
      });
      const successor = pickOwnershipSuccessor(members);
      if (successor) {
        await tx.shoppingList.update({
          where: { id: list.id },
          data: { createdByUserId: successor.userId },
        });
      }
      // If no members left, workspace should already be gone; skip.
    }

    const leftoverWorkspaces = await tx.workspace.findMany({
      where: { createdByUserId: userId },
      select: { id: true },
    });

    for (const ws of leftoverWorkspaces) {
      const members = await tx.workspaceMember.findMany({
        where: { workspaceId: ws.id },
        select: { id: true, userId: true, role: true, joinedAt: true },
      });
      const successor = pickOwnershipSuccessor(members);
      if (successor) {
        await tx.workspace.update({
          where: { id: ws.id },
          data: { createdByUserId: successor.userId },
        });
      } else {
        await tx.workspace.delete({ where: { id: ws.id } });
      }
    }

    await tx.user.delete({ where: { id: userId } });
  });
}
