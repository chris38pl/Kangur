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
  preferredForAi?: boolean;
}): Promise<ShoppingListDTO> {
  // Finished (archived) lists can still be starred for AI - allow archived when
  // preferredForAi is part of the update.
  const { list } = await authorizeList(input.listId, input.userId, {
    allowArchived: input.preferredForAi !== undefined,
  });

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
      ...(input.preferredForAi !== undefined
        ? { preferredForAi: input.preferredForAi }
        : {}),
    },
  });

  return toShoppingListDto(updated);
}
