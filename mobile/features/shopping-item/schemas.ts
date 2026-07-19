import { SHOPPING_CATEGORIES } from "@shared/shopping-categories";
import { z } from "zod";

export const ShoppingCategorySchema = z.enum(SHOPPING_CATEGORIES);
export const ItemStatusSchema = z.enum([
  "pending",
  "bought",
  "unavailable",
  "removed",
]);

export const ShoppingItemSchema = z.object({
  id: z.string(),
  clientId: z.string().nullable(),
  listId: z.string(),
  name: z.string(),
  normalizedName: z.string().nullable(),
  amount: z.string().nullable(),
  note: z.string().nullable(),
  category: ShoppingCategorySchema,
  status: ItemStatusSchema,
  sortOrder: z.number().int(),
  addedByUserId: z.string(),
  updatedByUserId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
export type ShoppingCategory = z.infer<typeof ShoppingCategorySchema>;
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

export const ShoppingItemListSchema = z.object({
  items: z.array(ShoppingItemSchema),
});

export const ShoppingEventTypeSchema = z.enum([
  "list_created",
  "item_created",
  "item_updated",
  "item_status_changed",
  "ai_applied",
]);

export const ShoppingEventSchema = z.object({
  id: z.string(),
  listId: z.string(),
  actorUserId: z.string(),
  type: ShoppingEventTypeSchema,
  payload: z.unknown().nullable(),
  createdAt: z.string(),
});

export const ShoppingEventListSchema = z.object({
  events: z.array(ShoppingEventSchema),
  nextCursor: z.string().nullable(),
});

export type ShoppingEvent = z.infer<typeof ShoppingEventSchema>;
export type ShoppingEventType = z.infer<typeof ShoppingEventTypeSchema>;
