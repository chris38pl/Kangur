import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { SHOPPING_CATEGORIES } from "@shared/shopping-categories";
import { SHOPPING_LIST_THEMES } from "@shared/shopping-themes";
import { z } from "zod";

extendZodWithOpenApi(z);

export const ShoppingListThemeSchema = z
  .enum(SHOPPING_LIST_THEMES)
  .openapi("ShoppingListTheme");

export const ShoppingContextSchema = z
  .object({
    title: z.string().trim().min(1).max(32),
    theme: ShoppingListThemeSchema,
  })
  .openapi("ShoppingContext");

export type ShoppingContext = z.infer<typeof ShoppingContextSchema>;

export const ProposalOperationSchema = z
  .object({
    proposalRowId: z.string(),
    op: z.enum(["create", "merge", "update", "ignore"]),
    targetItemId: z.string().nullable().optional(),
    clientId: z.string().nullable().optional(),
    name: z.string().min(1).max(120),
    amount: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    category: z.enum(SHOPPING_CATEGORIES),
    confidence: z.number().min(0).max(1),
    reason: z.string().nullable().optional(),
  })
  .openapi("AiProposalOperation");

export type ProposalOperation = z.infer<typeof ProposalOperationSchema>;

export const AiProposalSchema = z
  .object({
    shoppingContext: ShoppingContextSchema,
    operations: z.array(ProposalOperationSchema),
  })
  .openapi("AiProposal");

export const AiIngestResponseSchema = z
  .object({
    runId: z.string(),
    model: z.string(),
    promptVersion: z.string(),
    durationMs: z.number().int().nonnegative().nullable(),
    proposal: AiProposalSchema,
    fastPath: z.boolean(),
  })
  .openapi("AiIngestResponse");

export const ApplyOperationSchema = z
  .discriminatedUnion("op", [
    z.object({
      op: z.literal("create"),
      proposalRowId: z.string(),
      clientId: z.string().optional(),
      name: z.string().min(1).max(120),
      amount: z.string().nullable().optional(),
      note: z.string().nullable().optional(),
      category: z.enum(SHOPPING_CATEGORIES),
    }),
    z.object({
      op: z.literal("merge"),
      proposalRowId: z.string(),
      targetItemId: z.string(),
      name: z.string().min(1).max(120).optional(),
      amount: z.string().nullable().optional(),
      note: z.string().nullable().optional(),
      category: z.enum(SHOPPING_CATEGORIES).optional(),
    }),
    z.object({
      op: z.literal("update"),
      proposalRowId: z.string(),
      targetItemId: z.string(),
      name: z.string().min(1).max(120).optional(),
      amount: z.string().nullable().optional(),
      note: z.string().nullable().optional(),
      category: z.enum(SHOPPING_CATEGORIES).optional(),
      status: z
        .enum(["pending", "bought", "unavailable", "removed"])
        .optional(),
    }),
    z.object({
      op: z.literal("ignore"),
      proposalRowId: z.string(),
    }),
  ])
  .openapi("ApplyOperation");

export const ApplyAiProposalBodySchema = z
  .object({
    runId: z.string(),
    operations: z.array(ApplyOperationSchema),
  })
  .openapi("ApplyAiProposalBody");

export const ApplyAiProposalResponseSchema = z
  .object({
    applied: z.number().int().nonnegative(),
    items: z.array(
      z.object({
        id: z.string(),
        clientId: z.string().nullable(),
        listId: z.string(),
        name: z.string(),
        normalizedName: z.string().nullable(),
        amount: z.string().nullable(),
        note: z.string().nullable(),
        category: z.enum(SHOPPING_CATEGORIES),
        status: z.enum(["pending", "bought", "unavailable", "removed"]),
        sortOrder: z.number().int(),
        addedByUserId: z.string(),
        updatedByUserId: z.string(),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
      }),
    ),
  })
  .openapi("ApplyAiProposalResponse");
