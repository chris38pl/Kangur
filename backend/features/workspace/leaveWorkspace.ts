import type { User } from "@prisma/client";

import { notFound } from "@/lib/auth/errors";
import { prisma } from "@/lib/prisma";

import { ensureDefaultWorkspace } from "./ensureDefaultWorkspace";
import {
  recheckRenewalInTx,
  removalBlockerError,
  resolveWorkspaceRenewal,
} from "./removalGuards";
import { leaveWorkspaceBlocker } from "./workspaceRemoval";

/**
 * A non-owner removes their own membership. Lists they created stay in the
 * workspace, same as when an owner removes a member.
 *
 * If that was the user's last membership, a default "Home" workspace is
 * created in the same request so the app never lands on zero workspaces.
 */
export async function leaveWorkspace(
  workspaceId: string,
  user: Pick<User, "id" | "locale">,
): Promise<void> {
  // Real membership only: platform-admin browsing has nothing to leave.
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
  });
  if (!membership) {
    throw notFound("Workspace not found.");
  }

  const early = leaveWorkspaceBlocker({
    role: membership.role,
    callerUserId: user.id,
    renewal: { renewing: false },
  });
  if (early) throw removalBlockerError(early, "leave");

  const renewal = await resolveWorkspaceRenewal(workspaceId);
  const blocker = leaveWorkspaceBlocker({
    role: membership.role,
    callerUserId: user.id,
    renewal: renewal.verdict,
  });
  if (blocker) throw removalBlockerError(blocker, "leave");

  await prisma.$transaction(async (tx) => {
    const current = await tx.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (!current) {
      throw notFound("Workspace not found.");
    }

    const again = leaveWorkspaceBlocker({
      role: current.role,
      callerUserId: user.id,
      renewal: await recheckRenewalInTx(tx, workspaceId, renewal),
    });
    if (again) throw removalBlockerError(again, "leave");

    await tx.workspaceMember.delete({ where: { id: current.id } });
  });

  console.info("[workspace]", "WORKSPACE_LEFT", {
    workspaceId,
    userId: user.id,
    role: membership.role,
  });

  await ensureDefaultWorkspace(user);
}
