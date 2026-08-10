import { FREE_HISTORY_LIMIT } from "@/features/shopping-list/historyAccess";
import {
  HISTORY_LIST_TAKE,
  type HistorySourceList,
} from "@/features/shopping-list/mergeHistoryLists";
import { getWorkspaceEntitlement } from "@/lib/premium";
import { prisma } from "@/lib/prisma";
import type { ListStatus } from "@prisma/client";

const listItemsInclude = {
  items: {
    where: { status: { not: "removed" as const } },
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
    select: {
      name: true,
      amount: true,
      note: true,
      category: true,
      normalizedName: true,
    },
  },
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

type DbList = {
  id: string;
  name: string;
  updatedAt: Date;
  preferredForAi: boolean;
  items: Array<{
    name: string;
    amount: string | null;
    note: string | null;
    category: string;
    normalizedName: string | null;
  }>;
};

function toSourceList(list: DbList, index: number): HistorySourceList {
  return {
    id: list.id,
    name: list.name,
    updatedAt: list.updatedAt.toISOString(),
    preferredForAi: list.preferredForAi,
    recencyWeight: HISTORY_LIST_TAKE - index,
    items: list.items.map((item) => ({
      name: item.name,
      amount: item.amount,
      note: item.note,
      category: item.category,
      normalizedName: item.normalizedName ?? normalizeName(item.name),
    })),
  };
}

async function freeArchivedEligibleIds(
  workspaceId: string,
): Promise<string[] | null> {
  const { isPremium } = await getWorkspaceEntitlement(workspaceId);
  if (isPremium) return null;

  const recent = await prisma.shoppingList.findMany({
    where: {
      workspaceId,
      status: "archived",
      items: { some: { status: { not: "removed" } } },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: FREE_HISTORY_LIMIT,
    select: { id: true },
  });
  return recent.map((row) => row.id);
}

function buildStatusFilter(
  freeArchivedIds: string[] | null,
):
  | { status: { in: ListStatus[] } }
  | {
      OR: Array<
        | { status: "active" }
        | { status: "archived"; id: { in: string[] } }
      >;
    } {
  if (freeArchivedIds === null) {
    return { status: { in: ["active", "archived"] } };
  }
  // Free: any active list + archived only within history depth.
  if (freeArchivedIds.length === 0) {
    return { status: { in: ["active"] } };
  }
  return {
    OR: [
      { status: "active" },
      { status: "archived", id: { in: freeArchivedIds } },
    ],
  };
}

/**
 * Preferred-for-history lists first (newest preferred, max 5), then fill with
 * newest non-preferred until HISTORY_LIST_TAKE.
 * Free workspaces: archived sources limited to FREE_HISTORY_LIMIT.
 */
export async function selectHistorySourceLists(
  workspaceId: string,
): Promise<HistorySourceList[]> {
  const freeArchivedIds = await freeArchivedEligibleIds(workspaceId);
  const statusFilter = buildStatusFilter(freeArchivedIds);

  const baseWhere = {
    workspaceId,
    ...statusFilter,
    items: { some: { status: { not: "removed" as const } } },
  };

  const preferred = await prisma.shoppingList.findMany({
    where: { ...baseWhere, preferredForAi: true },
    include: listItemsInclude,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: HISTORY_LIST_TAKE,
  });

  const selected: DbList[] = [...preferred];
  const remaining = HISTORY_LIST_TAKE - selected.length;

  if (remaining > 0) {
    const fill = await prisma.shoppingList.findMany({
      where: {
        ...baseWhere,
        preferredForAi: false,
        ...(selected.length > 0
          ? { id: { notIn: selected.map((l) => l.id) } }
          : {}),
      },
      include: listItemsInclude,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: remaining,
    });
    selected.push(...fill);
  }

  selected.sort((a, b) => {
    if (a.preferredForAi !== b.preferredForAi) {
      return a.preferredForAi ? -1 : 1;
    }
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return selected.map((list, index) => toSourceList(list, index));
}

/**
 * Pure select for fixtures / tests - same algorithm as production DB select
 * (without Free depth — caller supplies already-eligible lists).
 */
export function selectHistorySourceListsFromFixtures(
  lists: HistorySourceList[],
): HistorySourceList[] {
  const preferred = [...lists]
    .filter((l) => l.preferredForAi)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, HISTORY_LIST_TAKE);

  const preferredIds = new Set(preferred.map((l) => l.id));
  const fill = [...lists]
    .filter((l) => !l.preferredForAi && !preferredIds.has(l.id))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, HISTORY_LIST_TAKE - preferred.length);

  const selected = [...preferred, ...fill];
  selected.sort((a, b) => {
    if (a.preferredForAi !== b.preferredForAi) {
      return a.preferredForAi ? -1 : 1;
    }
    return (
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  });

  return selected.map((list, index) => ({
    ...list,
    recencyWeight: HISTORY_LIST_TAKE - index,
  }));
}
