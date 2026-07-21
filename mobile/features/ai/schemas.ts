import { SHOPPING_CATEGORIES } from "@shared/shopping-categories";
import { SHOPPING_LIST_THEMES } from "@shared/shopping-themes";
import { z } from "zod";

export const ProposalOperationSchema = z.object({
  proposalRowId: z.string(),
  op: z.enum(["create", "merge", "update", "ignore"]),
  targetItemId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  name: z.string(),
  amount: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  category: z.enum(SHOPPING_CATEGORIES),
  confidence: z.number(),
  reason: z.string().nullable().optional(),
});

export type ProposalOperation = z.infer<typeof ProposalOperationSchema>;

export const ShoppingContextSchema = z.object({
  title: z.string().min(1).max(32),
  theme: z.enum(SHOPPING_LIST_THEMES),
});

export const AiIngestResponseSchema = z.object({
  runId: z.string(),
  model: z.string(),
  provider: z.string().optional(),
  proposalType: z.string().optional(),
  proposalVersion: z.number().int().positive().optional(),
  /** @deprecated Prefer proposalVersion */
  promptVersion: z.string().optional(),
  durationMs: z.number().nullable(),
  proposal: z.object({
    shoppingContext: ShoppingContextSchema.optional(),
    operations: z.array(ProposalOperationSchema),
  }),
  fastPath: z.boolean(),
});

export type AiIngestResponse = z.infer<typeof AiIngestResponseSchema>;

export const SuggestFromHistoryItemSchema = z.object({
  proposalRowId: z.string(),
  name: z.string(),
  amount: z.string().nullable(),
  note: z.string().nullable(),
  category: z.enum(SHOPPING_CATEGORIES),
  reason: z.string().nullable().optional(),
  timesSeen: z.number().int().min(1).max(5),
  lastSeenAt: z.string().datetime(),
});

export type SuggestFromHistoryItem = z.infer<
  typeof SuggestFromHistoryItemSchema
>;

export const SuggestFromHistoryResponseSchema = z.object({
  runId: z.string(),
  model: z.string(),
  provider: z.string(),
  proposalType: z.string(),
  proposalVersion: z.number().int().positive(),
  durationMs: z.number().nullable(),
  sourceListsCount: z.number().int().min(1).max(5),
  proposal: z.object({
    shoppingContext: ShoppingContextSchema,
    items: z.array(SuggestFromHistoryItemSchema),
  }),
});

export type SuggestFromHistoryResponse = z.infer<
  typeof SuggestFromHistoryResponseSchema
>;

export const ApplySuggestFromHistoryResponseSchema = z.object({
  list: z.object({
    id: z.string(),
    workspaceId: z.string(),
    name: z.string(),
    emoji: z.string(),
    status: z.enum(["active", "archived", "deleted"]),
    isUntitled: z.boolean(),
    itemCount: z.number(),
    itemNames: z.array(z.string()).default([]),
    previewItems: z
      .array(
        z.object({
          name: z.string(),
          category: z.enum(SHOPPING_CATEGORIES),
        }),
      )
      .default([]),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  applied: z.number(),
});

export const ApplyAiProposalResponseSchema = z.object({
  applied: z.number(),
  items: z.array(z.unknown()),
});
