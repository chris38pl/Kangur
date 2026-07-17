import { prisma } from "@/lib/prisma";
import { authorizeList } from "@/lib/authorize";

export async function archiveShoppingList(
  listId: string,
  userId: string,
): Promise<void> {
  const { list } = await authorizeList(listId, userId);

  await prisma.shoppingList.update({
    where: { id: list.id },
    data: { status: "archived" },
  });
}
