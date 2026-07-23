import { authorize, requireRole } from "@/lib/authorize";
import { validationError } from "@/lib/auth/errors";
import { prisma } from "@/lib/prisma";
import { isWorkspaceIconId } from "@shared/workspace-icons";

import { normalizeWorkspaceName } from "./normalizeName";
import { toWorkspaceDto, workspaceSubscriptionSelect } from "./toWorkspaceDto";
import type { WorkspaceDTO } from "./schemas";

export type UpdateWorkspaceInput = {
  workspaceId: string;
  userId: string;
  name?: string;
  icon?: string;
};

export async function updateWorkspace(
  input: UpdateWorkspaceInput,
): Promise<WorkspaceDTO> {
  const { membership } = await authorize(input.workspaceId, input.userId);
  requireRole(
    membership,
    ["owner", "admin"],
    "Only owners and admins can update this workspace.",
  );

  const data: { name?: string; icon?: string } = {};

  if (input.name !== undefined) {
    const name = normalizeWorkspaceName(input.name);
    if (name.length < 1 || name.length > 64) {
      throw validationError("Name must be between 1 and 64 characters.");
    }
    data.name = name;
  }

  if (input.icon !== undefined) {
    if (!isWorkspaceIconId(input.icon)) {
      throw validationError("Invalid workspace icon id.");
    }
    data.icon = input.icon;
  }

  if (Object.keys(data).length === 0) {
    throw validationError("Provide name and/or icon.");
  }

  const workspace = await prisma.workspace.update({
    where: { id: input.workspaceId },
    data,
    include: {
      subscription: { select: workspaceSubscriptionSelect },
      _count: { select: { members: true } },
    },
  });

  return toWorkspaceDto(workspace, membership.role);
}
