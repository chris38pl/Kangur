import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { SHOPPING_CATEGORIES } from "@shared/shopping-categories";
import { z } from "zod";

extendZodWithOpenApi(z);

export const ShoppingCategorySchema = z
  .enum(SHOPPING_CATEGORIES)
  .openapi("ShoppingCategory");

export const ItemStatusSchema = z
  .enum(["pending", "bought", "unavailable", "removed"])
  .openapi("ItemStatus");

export const ShoppingItemDTOSchema = z
  .object({
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
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("ShoppingItemDTO");

export const ShoppingItemListResponseSchema = z
  .object({
    items: z.array(ShoppingItemDTOSchema),
  })
  .openapi("ShoppingItemListResponse");

export const CreateShoppingItemBodySchema = z
  .object({
    clientId: z.string().uuid().optional(),
    name: z.string().min(1).max(120),
    amount: z.string().trim().min(1).max(64).optional(),
    note: z.string().trim().min(1).max(240).optional(),
    category: ShoppingCategorySchema.default("other"),
  })
  .openapi("CreateShoppingItemBody");

export const UpdateShoppingItemBodySchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    amount: z.string().trim().min(1).max(64).nullable().optional(),
    note: z.string().trim().min(1).max(240).nullable().optional(),
    category: ShoppingCategorySchema.optional(),
    status: ItemStatusSchema.optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.amount !== undefined ||
      value.note !== undefined ||
      value.category !== undefined ||
      value.status !== undefined,
    {
      message: "At least one field is required.",
    },
  )
  .openapi("UpdateShoppingItemBody");

export const ShoppingEventDTOSchema = z
  .object({
    id: z.string(),
    listId: z.string(),
    actorUserId: z.string(),
    type: z.enum([
      "list_created",
      "item_created",
      "item_updated",
      "item_status_changed",
      "ai_applied",
    ]),
    payload: z.unknown().nullable(),
    createdAt: z.string().datetime(),
  })
  .openapi("ShoppingEventDTO");

export const ShoppingEventListResponseSchema = z
  .object({
    events: z.array(ShoppingEventDTOSchema),
    nextCursor: z.string().nullable(),
  })
  .openapi("ShoppingEventListResponse");
