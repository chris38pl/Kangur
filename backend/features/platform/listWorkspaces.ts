import type { User } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { workspaceSubscriptionSelect } from "@/features/workspace/toWorkspaceDto";
import { requirePlatformAdmin } from "@/lib/authorize";
import { notFound } from "@/lib/auth/errors";
import { entitlementFromSubscription } from "@/lib/premium";
import { prisma } from "@/lib/prisma";

import type {
  PlatformWorkspaceDetailResponse,
  PlatformWorkspaceListItem,
  PlatformWorkspaceListResponse,
} from "./schemas";

const PAGE_SIZE = 30;

function maxDate(dates: Array<Date | null | undefined>): Date {
  let best = dates[0] ?? new Date(0);
  for (const d of dates) {
    if (d && d.getTime() > best.getTime()) best = d;
  }
  return best;
}

function lastUsedAtForRow(row: {
  updatedAt: Date;
  lists: { updatedAt: Date }[];
  shoppingSessions: { startedAt: Date; finishedAt: Date | null }[];
}): Date {
  return maxDate([
    row.updatedAt,
    ...row.lists.map((l) => l.updatedAt),
    ...row.shoppingSessions.flatMap((s) => [s.startedAt, s.finishedAt]),
  ]);
}

export type ListPlatformWorkspacesInput = {
  q?: string;
  plan?: "all" | "free" | "premium";
  cursor?: string;
};

/**
 * Paginated workspace browser for platform admins.
 * Search: workspace name + member emails. Filter: free / premium / all.
 */
export async function listPlatformWorkspaces(
  user: User,
  input: ListPlatformWorkspacesInput = {},
): Promise<PlatformWorkspaceListResponse> {
  requirePlatformAdmin(user);

  const q = input.q?.trim().toLowerCase() ?? "";
  const planFilter = input.plan ?? "all";

  const where: Prisma.WorkspaceWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          {
            members: {
              some: {
                user: { email: { contains: q, mode: "insensitive" } },
              },
            },
          },
        ],
      }
    : {};

  // Load a window larger than page when filtering by plan in memory
  // (entitlement rules are not a single SubscriptionStatus).
  const take =
    planFilter === "all" ? PAGE_SIZE + 1 : Math.min(200, PAGE_SIZE * 5);

  const rows = await prisma.workspace.findMany({
    where,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    take,
    orderBy: { updatedAt: "desc" },
    include: {
      subscription: { select: workspaceSubscriptionSelect },
      _count: { select: { members: true } },
      members: {
        where: { role: "owner" },
        take: 1,
        include: { user: { select: { email: true } } },
      },
      lists: {
        where: { status: { not: "deleted" } },
        select: { updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      shoppingSessions: {
        select: { startedAt: true, finishedAt: true },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });

  const mapped: PlatformWorkspaceListItem[] = [];
  for (const row of rows) {
    const entitlement = entitlementFromSubscription(row.subscription);
    if (planFilter !== "all" && entitlement.plan !== planFilter) continue;

    mapped.push({
      id: row.id,
      name: row.name,
      icon: row.icon,
      plan: entitlement.plan,
      memberCount: row._count.members,
      ownerEmail: row.members[0]?.user.email ?? null,
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: lastUsedAtForRow(row).toISOString(),
    });
  }

  const page = mapped.slice(0, PAGE_SIZE);
  const hasMore = mapped.length > PAGE_SIZE;
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

  const total = await prisma.workspace.count({ where });

  return {
    workspaces: page,
    nextCursor,
    total,
  };
}

export async function getPlatformWorkspaceDetail(
  user: User,
  workspaceId: string,
): Promise<PlatformWorkspaceDetailResponse> {
  requirePlatformAdmin(user);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      subscription: { select: workspaceSubscriptionSelect },
      _count: { select: { members: true } },
    },
  });

  if (!workspace) {
    throw notFound("Workspace not found.");
  }

  const entitlement = entitlementFromSubscription(workspace.subscription);

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      icon: workspace.icon,
      role: "owner",
      isOwner: true,
      memberCount: workspace._count.members,
      plan: entitlement.plan,
      billingStatus: entitlement.status,
      currentPeriodEnd: entitlement.currentPeriodEnd
        ? entitlement.currentPeriodEnd.toISOString()
        : null,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    },
  };
}

export async function deletePlatformWorkspace(
  user: User,
  workspaceId: string,
): Promise<void> {
  requirePlatformAdmin(user);

  const existing = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });
  if (!existing) {
    throw notFound("Workspace not found.");
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });
}
