import type { Workspace, WorkspaceMember, WorkspaceRole } from "@prisma/client";

import type { WorkspaceDTO } from "./schemas";

type WorkspaceWithRelations = Workspace & {
  subscription: { id: string } | null;
  _count: { members: number };
};

export function toWorkspaceDto(
  workspace: WorkspaceWithRelations,
  role: WorkspaceRole,
): WorkspaceDTO {
  return {
    id: workspace.id,
    name: workspace.name,
    icon: workspace.icon,
    role,
    isOwner: role === "owner",
    memberCount: workspace._count.members,
    plan: workspace.subscription ? "premium" : "free",
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
  };
}

export type MembershipWithWorkspace = WorkspaceMember & {
  workspace: WorkspaceWithRelations;
};
