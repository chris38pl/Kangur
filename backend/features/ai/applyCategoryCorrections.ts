import type { z } from "zod";

import { correctAndLogCategory } from "./logCategoryClassification";
import {
  AiProposalSchema,
  type MealProposalAiResponse,
} from "./schemas";

type AiProposal = z.infer<typeof AiProposalSchema>;

type SuggestItem = {
  name: string;
  amount?: string | null;
  note?: string | null;
  category: string;
  reason?: string | null;
  proposalRowId?: string;
  confidence?: number;
};

/** Apply CategoryCorrections to ingest/clipboard/screenshot proposal ops. */
export function applyCategoryCorrectionsToProposal(
  proposal: AiProposal,
): AiProposal {
  return {
    ...proposal,
    operations: proposal.operations.map((op) => {
      const { category } = correctAndLogCategory({
        name: op.name,
        aiCategory: op.category,
        confidence: op.confidence,
      });
      return { ...op, category };
    }),
  };
}

/** Apply CategoryCorrections to meal proposal ingredients. */
export function applyCategoryCorrectionsToMealAi(
  ai: MealProposalAiResponse,
): MealProposalAiResponse {
  return {
    ...ai,
    meals: ai.meals.map((meal) => ({
      ...meal,
      ingredients: meal.ingredients.map((ing) => {
        const { category } = correctAndLogCategory({
          name: ing.name,
          aiCategory: ing.category,
          confidence: ing.confidence,
        });
        return { ...ing, category };
      }),
    })),
  };
}

/** Apply CategoryCorrections to history-suggest items. */
export function applyCategoryCorrectionsToSuggestItems<T extends SuggestItem>(
  items: T[],
): T[] {
  return items.map((item) => {
    const { category } = correctAndLogCategory({
      name: item.name,
      aiCategory: item.category,
      confidence: item.confidence,
    });
    return { ...item, category };
  });
}
