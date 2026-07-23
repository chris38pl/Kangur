import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/authorize";

import { getWorkspaceEntitlement } from "@/lib/premium";

import {
  FREE_HISTORY_LIMIT,
  PREMIUM_HISTORY_CAP,
} from "./historyAccess";
import { toHistoryListDto } from "./toHistoryListDto";
import { PREVIEW_TAKE } from "./toShoppingListDto";
import type { HistoryListDTO } from "./schemas";

export async function listHistoryLists(
  workspaceId: string,
  userId: string,
): Promise<HistoryListDTO[]> {
  await authorize(workspaceId, userId);

  const entitlement = await getWorkspaceEntitlement(workspaceId);
  const take = entitlement.isPremium
    ? PREMIUM_HISTORY_CAP
    : FREE_HISTORY_LIMIT;

  const lists = await prisma.shoppingList.findMany({
    where: {
      workspaceId,
      status: "archived",
      items: {
        some: {
          status: { not: "removed" },
        },
      },
    },
    include: {
      _count: {
        select: {
          items: {
            where: { status: { not: "removed" } },
          },
        },
      },
      items: {
        where: { status: { not: "removed" } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        take: PREVIEW_TAKE,
        select: { name: true, category: true },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take,
  });

  return lists.map((list) =>
    toHistoryListDto({
      ...list,
      itemCount: list._count.items,
      // Preview-only names (UI cards + light search). Full-text item search → server ?q= later.
      itemNames: list.items.map((item) => item.name),
      previewItems: list.items.map((item) => ({
        name: item.name,
        category: item.category,
      })),
    }),
  );
}
