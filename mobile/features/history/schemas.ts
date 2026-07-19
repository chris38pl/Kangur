import { z } from "zod";

import { ShoppingListSchema } from "@/features/shopping-list/schemas";

/** Same shape as shopping-list preview items (name + category). */
export type HistoryPreviewItem = NonNullable<
  z.infer<typeof ShoppingListSchema>["previewItems"]
>[number];

export const HistoryListSchema = ShoppingListSchema;

export type HistoryList = z.infer<typeof HistoryListSchema>;

export const HistoryListResponseSchema = z.object({
  lists: z.array(HistoryListSchema),
});
