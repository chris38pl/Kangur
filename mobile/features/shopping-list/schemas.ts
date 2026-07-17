import { z } from "zod";

export const ShoppingListSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  emoji: z.string(),
  status: z.enum(["active", "archived"]),
  isUntitled: z.boolean().default(true),
  itemCount: z.number().int().nonnegative().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ShoppingList = z.infer<typeof ShoppingListSchema>;

export const ShoppingListListSchema = z.object({
  lists: z.array(ShoppingListSchema),
});
