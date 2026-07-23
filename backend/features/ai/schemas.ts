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
    provider: z.string(),
    proposalType: z.string(),
    proposalVersion: z.number().int().positive(),
    durationMs: z.number().int().nonnegative().nullable(),
    proposal: AiProposalSchema,
    fastPath: z.boolean(),
  })
  .openapi("AiIngestResponse");

export const SuggestFromHistoryItemSchema = z
  .object({
    proposalRowId: z.string(),
    name: z.string().min(1).max(120),
    amount: z.string().nullable(),
    note: z.string().nullable(),
    category: z.enum(SHOPPING_CATEGORIES),
    reason: z.string().nullable().optional(),
    timesSeen: z.number().int().min(1).max(5),
    lastSeenAt: z.string().datetime(),
  })
  .openapi("SuggestFromHistoryItem");

export type SuggestFromHistoryItem = z.infer<
  typeof SuggestFromHistoryItemSchema
>;

export const SuggestFromHistoryProposalSchema = z
  .object({
    shoppingContext: ShoppingContextSchema,
    items: z.array(SuggestFromHistoryItemSchema),
  })
  .openapi("SuggestFromHistoryProposal");

export const SuggestFromHistoryResponseSchema = z
  .object({
    runId: z.string(),
    model: z.string(),
    provider: z.string(),
    proposalType: z.string(),
    proposalVersion: z.number().int().positive(),
    durationMs: z.number().int().nonnegative().nullable(),
    sourceListsCount: z.number().int().min(1).max(5),
    proposal: SuggestFromHistoryProposalSchema,
  })
  .openapi("SuggestFromHistoryResponse");

export const ApplySuggestFromHistoryBodySchema = z
  .object({
    runId: z.string(),
    acceptedProposalRowIds: z.array(z.string()).min(1),
  })
  .openapi("ApplySuggestFromHistoryBody");

export const ApplySuggestFromHistoryResponseSchema = z
  .object({
    list: z
      .object({
        id: z.string(),
        workspaceId: z.string(),
        name: z.string(),
        emoji: z.string(),
        status: z.enum(["active", "archived", "deleted"]),
        isUntitled: z.boolean(),
        itemCount: z.number().int().nonnegative(),
        itemNames: z.array(z.string()),
        previewItems: z.array(
          z.object({
            name: z.string(),
            category: z.enum(SHOPPING_CATEGORIES),
          }),
        ),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
      })
      .openapi("SuggestAppliedShoppingList"),
    applied: z.number().int().positive(),
  })
  .openapi("ApplySuggestFromHistoryResponse");

export const AbandonSuggestFromHistoryBodySchema = z
  .object({
    runId: z.string(),
  })
  .openapi("AbandonSuggestFromHistoryBody");

export const ApplyOperationSchema = z
  .discriminatedUnion("op", [
    z.object({
      op: z.literal("create"),
      proposalRowId: z.string(),
      clientId: z.string().optional(),
    }),
    z.object({
      op: z.literal("merge"),
      proposalRowId: z.string(),
      targetItemId: z.string(),
    }),
    z.object({
      op: z.literal("update"),
      proposalRowId: z.string(),
      targetItemId: z.string(),
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
    /** Decisions only — name/amount/category rehydrated from stored proposal. */
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

export const MealProposalIngredientSchema = z
  .object({
    proposalRowId: z.string(),
    name: z.string().min(1).max(120),
    amount: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    category: z.enum(SHOPPING_CATEGORIES),
    confidence: z.number().min(0).max(1).optional(),
  })
  .openapi("MealProposalIngredient");

export const MealProposalMealSchema = z
  .object({
    mealId: z.string().min(1),
    title: z.string().min(1).max(80),
    icon: z.string().min(1).max(8),
    ingredients: z.array(MealProposalIngredientSchema).min(1),
  })
  .openapi("MealProposalMeal");

export const MealProposalAiResponseSchema = z
  .object({
    meals: z.array(MealProposalMealSchema).min(1).max(5),
  })
  .openapi("MealProposalAiResponse");

export type MealProposalAiResponse = z.infer<
  typeof MealProposalAiResponseSchema
>;

export const MealProposalOperationSchema = ProposalOperationSchema.extend({
  ownerMealId: z.string().min(1),
}).openapi("MealProposalOperation");

export type MealProposalOperation = z.infer<
  typeof MealProposalOperationSchema
>;

export const MealProposalSchema = z
  .object({
    shoppingContext: ShoppingContextSchema.optional(),
    meals: z
      .array(
        z.object({
          mealId: z.string(),
          title: z.string(),
          icon: z.string(),
        }),
      )
      .min(1)
      .max(5),
    operations: z.array(MealProposalOperationSchema),
  })
  .openapi("MealProposal");

export type MealProposal = z.infer<typeof MealProposalSchema>;

export const MealProposalRequestBodySchema = z
  .object({
    dishes: z.array(z.string().trim().min(1).max(80)).min(1).max(5),
  })
  .openapi("MealProposalRequestBody");

export const MealProposalResponseSchema = z
  .object({
    runId: z.string(),
    model: z.string(),
    provider: z.string(),
    proposalType: z.string(),
    proposalVersion: z.number().int().positive(),
    durationMs: z.number().int().nonnegative().nullable(),
    proposal: MealProposalSchema,
  })
  .openapi("MealProposalResponse");

export const AbandonMealProposalBodySchema = z
  .object({
    runId: z.string(),
  })
  .openapi("AbandonMealProposalBody");
