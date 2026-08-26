import type { AppLocale } from "@shared/locales";
import {
  matchCatalogProduct,
  resolveCatalogLabel,
} from "@shared/product-catalog";
import type { z } from "zod";

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

/**
 * Strict catalog normalization before CategoryCorrections.
 * Exact label / equivalent alias only — never destroys specificity.
 */
export function applyCatalogMatchToProposal(
  proposal: AiProposal,
  locale: AppLocale,
): AiProposal {
  return {
    ...proposal,
    operations: proposal.operations.map((op) => {
      const hit = matchCatalogProduct(op.name, locale);
      if (!hit) return op;
      return {
        ...op,
        name: resolveCatalogLabel(hit, locale),
        category: hit.category,
      };
    }),
  };
}

export function applyCatalogMatchToMealAi(
  ai: MealProposalAiResponse,
  locale: AppLocale,
): MealProposalAiResponse {
  return {
    ...ai,
    meals: ai.meals.map((meal) => ({
      ...meal,
      ingredients: meal.ingredients.map((ing) => {
        const hit = matchCatalogProduct(ing.name, locale);
        if (!hit) return ing;
        return {
          ...ing,
          name: resolveCatalogLabel(hit, locale),
          category: hit.category,
        };
      }),
    })),
  };
}

export function applyCatalogMatchToSuggestItems<T extends SuggestItem>(
  items: T[],
  locale: AppLocale,
): T[] {
  return items.map((item) => {
    const hit = matchCatalogProduct(item.name, locale);
    if (!hit) return item;
    return {
      ...item,
      name: resolveCatalogLabel(hit, locale),
      category: hit.category,
    };
  });
}
