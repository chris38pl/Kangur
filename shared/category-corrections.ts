import type { ShoppingCategory } from "./shopping-categories";
import { isShoppingCategory } from "./shopping-categories";

/**
 * Business-only category overrides after AI output.
 * Never mutates name / amount / note — only `category`.
 * Do NOT use this for language-dependent AI error fixes (mąka→pantry, etc.).
 */
export type CategoryCorrectionResult = {
  category: ShoppingCategory;
  corrected: boolean;
  correctionRule: string | null;
};

/** Exact lowercase names that always map to `other` (cooking oils). */
const OIL_EXACT = new Set([
  "olej",
  "oliwa",
  "oil",
  "öl",
  "olaj",
  "huile",
  "aceite",
  "olio",
  "олія",
  "алей",
]);

/**
 * Prefixes (lowercase). Match when name equals prefix or starts with
 * `prefix + " "` / `prefix + "-"`. Avoids `olej` matching `olejek`.
 */
const OIL_PREFIXES = [
  "oliwa",
  "olive oil",
  "cooking oil",
  "vegetable oil",
  "sunflower oil",
  "rapeseed oil",
  "olej roślinny",
  "olej slonecznikowy",
  "olej słonecznikowy",
  "olej rzepakowy",
  "olivenöl",
  "olivenol",
  "pflanzenöl",
  "pflanzenol",
  "sonnenblumenöl",
  "huile d'olive",
  "huile dolive",
  "huile végétale",
  "huile vegetale",
  "huile de tournesol",
  "aceite de oliva",
  "aceite vegetal",
  "aceite de girasol",
  "olio d'oliva",
  "olio doliva",
  "olio di oliva",
  "olio vegetale",
  "olivový olej",
  "rostlinný olej",
  "оливковое масло",
  "растительное масло",
  "подсолнечное масло",
  "оливкова олія",
  "соняшникова олія",
  "рослинна олія",
  "аліўкавы алей",
  "раслінны алей",
] as const;

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchesOilName(normalized: string): boolean {
  if (OIL_EXACT.has(normalized)) return true;
  for (const prefix of OIL_PREFIXES) {
    if (
      normalized === prefix ||
      normalized.startsWith(`${prefix} `) ||
      normalized.startsWith(`${prefix}-`)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Apply business category corrections. Pass-through when no rule matches.
 * Invalid incoming categories are left unchanged (caller should Zod-validate first).
 */
export function applyCategoryCorrection(
  name: string,
  aiCategory: string,
): CategoryCorrectionResult {
  const normalized = normalizeName(name);
  if (normalized && matchesOilName(normalized)) {
    return {
      category: "other",
      corrected: aiCategory !== "other",
      correctionRule: "oil->other",
    };
  }

  if (isShoppingCategory(aiCategory)) {
    return {
      category: aiCategory,
      corrected: false,
      correctionRule: null,
    };
  }

  return {
    category: "other",
    corrected: false,
    correctionRule: null,
  };
}
