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
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return lists.map(toShoppingListDto);
}
