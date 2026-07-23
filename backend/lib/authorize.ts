import type {
  PlatformRole,
  ShoppingList,
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { forbidden, notFound } from "@/lib/auth/errors";

export function isPlatformAdmin(user: Pick<User, "platformRole">): boolean {
  return user.platformRole === "ADMIN";
}

/** Platform Console and other platform-ops APIs. Hidden menu ≠ authorization. */
export function requirePlatformAdmin(
  user: Pick<User, "platformRole">,
  message = "Platform admin required.",
): void {
  if (!isPlatformAdmin(user)) {
    throw forbidden(message);
  }
}

export type AuthorizeResult = {
  workspace: Workspace;
  membership: WorkspaceMember;
};

export type AuthorizeListResult = {
  list: ShoppingList;
  workspace: Workspace;
  membership: WorkspaceMember;
};

/** In-memory owner membership — never persisted; for platform ADMIN bypass only. */
function syntheticOwnerMembership(
  workspaceId: string,
  userId: string,
): WorkspaceMember {
  return {
    id: `platform-admin:${workspaceId}:${userId}`,
    workspaceId,
    userId,
    role: "owner",
    joinedAt: new Date(0),
  };
}

async function platformAdminAuthorize(
  workspaceId: string,
  userId: string,
): Promise<AuthorizeResult | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { platformRole: true },
  });
  if (!user || !isPlatformAdmin(user)) return null;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) return null;

  return {
    workspace,
    membership: syntheticOwnerMembership(workspaceId, userId),
  };
}

export async function authorize(
  workspaceId: string,
  userId: string,
): Promise<AuthorizeResult> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
    include: { workspace: true },
  });

  if (membership) {
    return {
      workspace: membership.workspace,
      membership,
    };
  }

  const asAdmin = await platformAdminAuthorize(workspaceId, userId);
  if (asAdmin) return asAdmin;

  throw notFound("Workspace not found.");
}

export function requireRole(
  membership: WorkspaceMember,
  allowed: WorkspaceRole[],
  message = "Forbidden.",
): void {
  if (!allowed.includes(membership.role)) {
    throw forbidden(message);
  }
}

export async function authorizeList(
  listId: string,
  userId: string,
  options?: { allowArchived?: boolean },
): Promise<AuthorizeListResult> {
  const allowArchived = options?.allowArchived === true;

  const list = await prisma.shoppingList.findUnique({
    where: { id: listId },
  });

  if (!list || list.status === "deleted") {
    throw notFound("List not found.");
  }

  if (!allowArchived && list.status === "archived") {
    throw notFound("List not found.");
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: list.workspaceId,
        userId,
      },
    },
    include: { workspace: true },
  });

  if (membership) {
    return {
      list,
      workspace: membership.workspace,
      membership,
    };
  }

  const asAdmin = await platformAdminAuthorize(list.workspaceId, userId);
  if (asAdmin) {
    return {
      list,
      workspace: asAdmin.workspace,
      membership: asAdmin.membership,
    };
  }

  throw notFound("List not found.");
}

export type { PlatformRole, WorkspaceRole };
