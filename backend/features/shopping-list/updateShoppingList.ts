import { resolveShoppingCategoryOrder } from "@shared/shopping-categories";
import { MAX_PREFERRED_FOR_AI_LISTS } from "@shared/ai-history";

import { prisma } from "@/lib/prisma";
import { authorizeList } from "@/lib/authorize";
import { conflict, validationError } from "@/lib/auth/errors";

import { normalizeShoppingListName } from "./normalizeName";
import { toShoppingListDto } from "./toShoppingListDto";
import type { ShoppingListDTO } from "./schemas";

export async function updateShoppingList(input: {
  listId: string;
  userId: string;
  name?: string;
  emoji?: string;
  preferredForAi?: boolean;
  categoryOrder?: string[];
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

  if (input.preferredForAi === true && !list.preferredForAi) {
    const preferredCount = await prisma.shoppingList.count({
      where: {
        workspaceId: list.workspaceId,
        preferredForAi: true,
        status: { in: ["active", "archived"] },
        id: { not: list.id },
      },
    });
    if (preferredCount >= MAX_PREFERRED_FOR_AI_LISTS) {
      throw conflict(
        `You can mark up to ${MAX_PREFERRED_FOR_AI_LISTS} lists for AI. Unstar one first.`,
        { code: "PREFERRED_FOR_AI_LIMIT", limit: MAX_PREFERRED_FOR_AI_LISTS },
      );
    }
  }

  const categoryOrder =
    input.categoryOrder === undefined
      ? undefined
      : resolveShoppingCategoryOrder(input.categoryOrder);

  const updated = await prisma.shoppingList.update({
    where: { id: list.id },
    data: {
      ...(name !== undefined ? { name, isUntitled: false } : {}),
      ...(input.emoji !== undefined ? { emoji: input.emoji } : {}),
      ...(input.preferredForAi !== undefined
        ? { preferredForAi: input.preferredForAi }
        : {}),
      ...(categoryOrder !== undefined ? { categoryOrder } : {}),
    },
  });

  return toShoppingListDto(updated);
}
