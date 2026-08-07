import type { Workspace, WorkspaceMember, WorkspaceRole } from "@prisma/client";

import { entitlementFromSubscription } from "@/lib/premium";

import type { WorkspaceDTO } from "./schemas";

export const workspaceSubscriptionSelect = {
  status: true,
  currentPeriodEnd: true,
  productId: true,
  billingOwnerUserId: true,
} as const;

type WorkspaceWithRelations = Workspace & {
  subscription: {
    status: import("@prisma/client").SubscriptionStatus;
    currentPeriodEnd: Date | null;
    productId: string | null;
    billingOwnerUserId: string | null;
  } | null;
  _count: { members: number };
};

export function toWorkspaceDto(
  workspace: WorkspaceWithRelations,
  role: WorkspaceRole,
): WorkspaceDTO {
  const entitlement = entitlementFromSubscription(workspace.subscription);
  return {
    id: workspace.id,
    name: workspace.name,
    icon: workspace.icon,
    role,
    isOwner: role === "owner",
    memberCount: workspace._count.members,
    plan: entitlement.plan,
    billingStatus: entitlement.status,
    currentPeriodEnd: entitlement.currentPeriodEnd
      ? entitlement.currentPeriodEnd.toISOString()
      : null,
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
  };
}

export type MembershipWithWorkspace = WorkspaceMember & {
  workspace: WorkspaceWithRelations;
};
