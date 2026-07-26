import type { CategoryCorrectionResult } from "@shared/category-corrections";
import { applyCategoryCorrection } from "@shared/category-corrections";
import type { ShoppingCategory } from "@shared/shopping-categories";

export type CategoryClassificationLog = {
  product: string;
  aiCategory: string;
  finalCategory: ShoppingCategory;
  corrected: boolean;
  correctionRule: string | null;
  confidence?: number;
};

/** Structured ops log for category quality analysis (not user-facing). */
export function logCategoryClassification(event: CategoryClassificationLog): void {
  console.info("[ai]", "CategoryClassification", JSON.stringify(event));
}

/**
 * Apply business CategoryCorrections and emit a structured log.
 * Never mutates name/amount/note — only category.
 */
export function correctAndLogCategory(input: {
  name: string;
  aiCategory: string;
  confidence?: number | null;
}): CategoryCorrectionResult & { category: ShoppingCategory } {
  const result = applyCategoryCorrection(input.name, input.aiCategory);
  logCategoryClassification({
    product: input.name,
    aiCategory: input.aiCategory,
    finalCategory: result.category,
    corrected: result.corrected,
    correctionRule: result.correctionRule,
    confidence:
      typeof input.confidence === "number" ? input.confidence : undefined,
  });
  return result;
}
