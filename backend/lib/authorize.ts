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

  if (!membership) {
    throw notFound("Workspace not found.");
  }

  return {
    workspace: membership.workspace,
    membership,
  };
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

  if (!membership) {
    throw notFound("List not found.");
  }

  return {
    list,
    workspace: membership.workspace,
    membership,
  };
}

export type { PlatformRole, WorkspaceRole };
