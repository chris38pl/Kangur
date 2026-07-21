import { prisma } from "@/lib/prisma";

import { toWorkspaceDto, workspaceSubscriptionSelect } from "./toWorkspaceDto";
import type { WorkspaceDTO } from "./schemas";

export async function listWorkspaces(userId: string): Promise<WorkspaceDTO[]> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          subscription: { select: workspaceSubscriptionSelect },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map((m) => toWorkspaceDto(m.workspace, m.role));
}
