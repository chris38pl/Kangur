import { Prisma } from "@prisma/client";

import { authorize, isPlatformAdminBypass } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

import {
  recheckRenewalInTx,
  removalBlockerError,
  resolveWorkspaceRenewal,
} from "./removalGuards";
import { deleteWorkspaceBlocker } from "./workspaceRemoval";

/**
 * Owner deletes a workspace. Cascades members, lists, sessions, AI usage,
 * notifications, invitations and billing rows (see schema.prisma).
 *
 * Blocked while a paid subscription will renew: dropping our record would
 * leave the store or Stripe charging for a workspace that no longer exists.
 */
export async function deleteWorkspace(
  workspaceId: string,
  userId: string,
): Promise<void> {
  const { membership: authorized } = await authorize(workspaceId, userId);
  // Platform admins browse as a synthetic owner; deleting stays with the real
  // owner here (admins have DELETE /api/v1/platform/workspaces/{id}).
  const membership = isPlatformAdminBypass(authorized)
    ? { ...authorized, role: "member" as const }
    : authorized;

  const countOtherMemberships = (db: Prisma.TransactionClient | typeof prisma) =>
    db.workspaceMember.count({
      where: { userId, NOT: { workspaceId } },
    });

  const otherMembershipCount = await countOtherMemberships(prisma);

  // Role and last-workspace first: no store lookup for a request that fails anyway.
  const early = deleteWorkspaceBlocker({
    role: membership.role,
    callerUserId: userId,
    otherMembershipCount,
    renewal: { renewing: false },
  });
  if (early) throw removalBlockerError(early, "delete");

  const renewal = await resolveWorkspaceRenewal(workspaceId);
  const blocker = deleteWorkspaceBlocker({
    role: membership.role,
    callerUserId: userId,
    otherMembershipCount,
    renewal: renewal.verdict,
  });
  if (blocker) throw removalBlockerError(blocker, "delete");

  const counts = await prisma.$transaction(async (tx) => {
    // Billing upserts and new memberships reference this row, so they wait.
    await tx.$queryRaw(
      Prisma.sql`SELECT id FROM "Workspace" WHERE id = ${workspaceId} FOR UPDATE`,
    );

    const again = deleteWorkspaceBlocker({
      role: membership.role,
      callerUserId: userId,
      otherMembershipCount: await countOtherMemberships(tx),
      renewal: await recheckRenewalInTx(tx, workspaceId, renewal),
    });
    if (again) throw removalBlockerError(again, "delete");

    const [memberCount, listCount] = await Promise.all([
      tx.workspaceMember.count({ where: { workspaceId } }),
      tx.shoppingList.count({
        where: { workspaceId, status: { not: "deleted" } },
      }),
    ]);

    await tx.workspace.delete({ where: { id: workspaceId } });
    return { memberCount, listCount };
  });

  console.info("[workspace]", "WORKSPACE_DELETED", {
    workspaceId,
    actorUserId: userId,
    memberCount: counts.memberCount,
    listCount: counts.listCount,
    hadSubscription: renewal.stored != null,
  });
}
