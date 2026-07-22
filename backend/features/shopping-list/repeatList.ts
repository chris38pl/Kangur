import { prisma } from "@/lib/prisma";
import { authorizeList } from "@/lib/authorize";
import { conflict } from "@/lib/auth/errors";

import { assertArchivedListWithinHistoryDepth } from "./historyAccess";
import { toShoppingListDto } from "./toShoppingListDto";
import type { ShoppingListDTO } from "./schemas";

/**
 * Duplicate an archived list as a new active list.
 * Copies all business-relevant item fields; resets runtime shopping state to pending.
 */
export async function repeatList(input: {
  listId: string;
  userId: string;
}): Promise<ShoppingListDTO> {
  const { list } = await authorizeList(input.listId, input.userId, {
    allowArchived: true,
  });

  if (list.status !== "archived") {
    throw conflict("Only archived lists can be repeated.");
  }

  await assertArchivedListWithinHistoryDepth({
    workspaceId: list.workspaceId,
    listId: list.id,
  });

  const sourceItems = await prisma.shoppingItem.findMany({
    where: {
      listId: list.id,
      status: { not: "removed" },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const created = await prisma.$transaction(async (tx) => {
    const newList = await tx.shoppingList.create({
      data: {
        workspaceId: list.workspaceId,
        name: list.name,
        emoji: list.emoji,
        isUntitled: list.isUntitled,
        categoryOrder: list.categoryOrder,
        status: "active",
        createdByUserId: input.userId,
      },
    });

    if (sourceItems.length > 0) {
      await tx.shoppingItem.createMany({
        data: sourceItems.map((item) => ({
          listId: newList.id,
          name: item.name,
          normalizedName: item.normalizedName,
          amount: item.amount,
          note: item.note,
          category: item.category,
          sortOrder: item.sortOrder,
          status: "pending" as const,
          addedByUserId: input.userId,
          updatedByUserId: input.userId,
        })),
      });
    }

    await tx.shoppingEvent.create({
      data: {
        listId: newList.id,
        actorUserId: input.userId,
        type: "list_created",
        payload: { action: "repeated", sourceListId: list.id },
      },
    });

    return newList;
  });

  return toShoppingListDto({
    ...created,
    itemCount: sourceItems.length,
  });
}
