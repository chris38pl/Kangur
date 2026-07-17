import { prisma } from "@/lib/prisma";
import { authorizeList } from "@/lib/authorize";
import { validationError } from "@/lib/auth/errors";

import { normalizeShoppingListName } from "./normalizeName";
import { toShoppingListDto } from "./toShoppingListDto";
import type { ShoppingListDTO } from "./schemas";

export async function updateShoppingList(input: {
  listId: string;
  userId: string;
  name?: string;
  emoji?: string;
}): Promise<ShoppingListDTO> {
  const { list } = await authorizeList(input.listId, input.userId);

  const name =
    input.name === undefined
      ? undefined
      : normalizeShoppingListName(input.name);

  if (name !== undefined && (name.length < 1 || name.length > 64)) {
    throw validationError("Name must be between 1 and 64 characters.");
  }

  const updated = await prisma.shoppingList.update({
    where: { id: list.id },
    data: {
      ...(name !== undefined ? { name, isUntitled: false } : {}),
      ...(input.emoji !== undefined ? { emoji: input.emoji } : {}),
    },
  });

  return toShoppingListDto(updated);
}
