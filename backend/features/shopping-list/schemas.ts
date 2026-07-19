import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { isShoppingListEmoji } from "@shared/shopping-list-emojis";
import { z } from "zod";

import { ShoppingCategorySchema } from "@/features/shopping-item/schemas";

extendZodWithOpenApi(z);

export const ShoppingListStatusSchema = z
  .enum(["active", "archived", "deleted"])
  .openapi("ShoppingListStatus");

export const HistoryPreviewItemSchema = z
  .object({
    name: z.string(),
    category: ShoppingCategorySchema,
  })
  .openapi("HistoryPreviewItem");

export const ShoppingListDTOSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    name: z.string(),
    emoji: z.string(),
    status: ShoppingListStatusSchema,
    isUntitled: z.boolean(),
    itemCount: z.number().int().nonnegative(),
    /** All non-removed item names — used for client search. */
    itemNames: z.array(z.string()).default([]),
    /** First items for badge previews on list cards. */
    previewItems: z.array(HistoryPreviewItemSchema).default([]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("ShoppingListDTO");

export type ShoppingListDTO = z.infer<typeof ShoppingListDTOSchema>;

export const HistoryListDTOSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    name: z.string(),
    emoji: z.string(),
    status: ShoppingListStatusSchema,
    isUntitled: z.boolean(),
    itemCount: z.number().int().nonnegative(),
    itemNames: z.array(z.string()).default([]),
    previewItems: z.array(HistoryPreviewItemSchema),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("HistoryListDTO");

export type HistoryListDTO = z.infer<typeof HistoryListDTOSchema>;

export const ShoppingListListResponseSchema = z
  .object({
    lists: z.array(ShoppingListDTOSchema),
  })
  .openapi("ShoppingListListResponse");

export const HistoryListResponseSchema = z
  .object({
    lists: z.array(HistoryListDTOSchema),
  })
  .openapi("HistoryListResponse");

export const CreateShoppingListBodySchema = z
  .object({
    name: z.string().min(1).max(64),
    emoji: z
      .string()
      .optional()
      .refine((value) => value === undefined || isShoppingListEmoji(value), {
        message: "Invalid shopping list emoji.",
      }),
  })
  .openapi("CreateShoppingListBody");

export const UpdateShoppingListBodySchema = z
  .object({
    name: z.string().min(1).max(64).optional(),
    emoji: z
      .string()
      .optional()
      .refine((value) => value === undefined || isShoppingListEmoji(value), {
        message: "Invalid shopping list emoji.",
      }),
  })
  .refine((value) => value.name !== undefined || value.emoji !== undefined, {
    message: "At least one field is required.",
  })
  .openapi("UpdateShoppingListBody");
