import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/authorize";

import { toWorkspaceDto, workspaceSubscriptionSelect } from "./toWorkspaceDto";
import type { WorkspaceDTO } from "./schemas";

export async function getWorkspace(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceDTO> {
  const { membership } = await authorize(workspaceId, userId);

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: {
      subscription: { select: workspaceSubscriptionSelect },
      _count: { select: { members: true } },
    },
  });

  return toWorkspaceDto(workspace, membership.role);
}
