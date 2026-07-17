import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/authorize";

import { toShoppingListDto } from "./toShoppingListDto";
import type { ShoppingListDTO } from "./schemas";

export async function listShoppingLists(
  workspaceId: string,
  userId: string,
): Promise<ShoppingListDTO[]> {
  await authorize(workspaceId, userId);

  const lists = await prisma.shoppingList.findMany({
    where: {
      workspaceId,
      status: "active",
    },
    include: {
      _count: {
        select: {
          items: {
            where: { status: { not: "removed" } },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return lists.map((list) =>
    toShoppingListDto({
      ...list,
      itemCount: list._count.items,
    }),
  );
}
