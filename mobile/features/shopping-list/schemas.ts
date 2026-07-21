import { z } from "zod";

import { ShoppingCategorySchema } from "@/features/shopping-item/schemas";

export const ShoppingListPreviewItemSchema = z.object({
  name: z.string(),
  category: ShoppingCategorySchema,
});

export const ShoppingListSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  emoji: z.string(),
  status: z.enum(["active", "archived", "deleted"]),
  isUntitled: z.boolean().default(true),
  preferredForAi: z.boolean().default(false),
  itemCount: z.number().int().nonnegative().default(0),
  itemNames: z.array(z.string()).default([]),
  previewItems: z.array(ShoppingListPreviewItemSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ShoppingList = z.infer<typeof ShoppingListSchema>;

export const ShoppingListListSchema = z.object({
  lists: z.array(ShoppingListSchema),
});
