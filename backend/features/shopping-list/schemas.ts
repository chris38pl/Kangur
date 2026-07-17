import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { isShoppingListEmoji } from "@shared/shopping-list-emojis";
import { z } from "zod";

extendZodWithOpenApi(z);

export const ShoppingListStatusSchema = z
  .enum(["active", "archived"])
  .openapi("ShoppingListStatus");

export const ShoppingListDTOSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    name: z.string(),
    emoji: z.string(),
    status: ShoppingListStatusSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("ShoppingListDTO");

export type ShoppingListDTO = z.infer<typeof ShoppingListDTOSchema>;

export const ShoppingListListResponseSchema = z
  .object({
    lists: z.array(ShoppingListDTOSchema),
  })
  .openapi("ShoppingListListResponse");

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
