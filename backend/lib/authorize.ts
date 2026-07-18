import type {
  ShoppingList,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { forbidden, notFound } from "@/lib/auth/errors";

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
): Promise<AuthorizeListResult> {
  const list = await prisma.shoppingList.findUnique({
    where: { id: listId },
  });

  if (!list || list.status === "archived") {
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

export type { WorkspaceRole };
