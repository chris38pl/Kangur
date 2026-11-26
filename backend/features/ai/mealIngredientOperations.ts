/**
 * The ingredients of all dishes in a meal proposal, as one create or merge
 * operation per ingredient.
 *
 * The same ingredient in two dishes becomes one row with the note "na A i B".
 * That row keeps every amount: pasta for 500 g in one dish and 400 g in the
 * other is "500 g + 400 g", and 500 g in both is "500 g + 500 g", because each
 * dish needs its own. A row that merges into an item already on the list keeps
 * the item's amount and note and adds the dishes' after them.
 *
 * Pure: no Prisma and no path aliases, so
 * `node --test --experimental-strip-types` runs the tests directly.
 */

import type { AiOutputLanguage } from "./outputLanguage";
import type {
  MealProposalAiResponse,
  MealProposalOperation,
} from "./schemas";

export type Meal = MealProposalAiResponse["meals"][number];

export type ListItem = {
  id: string;
  name: string;
  amount: string | null;
  note: string | null;
  status: string;
};

/**
 * Longest amount an item can have: the item API accepts 64 characters and
 * applyAiProposal cuts a longer amount to 64.
 */
export const MAX_AMOUNT_CHARS = 64;

/** Connector words for shared-ingredient notes: "für X und Y" / "for X and Y". */
const MEAL_NOTE_LOCALE: Record<
  AiOutputLanguage,
  { for: string; and: string }
> = {
  pl: { for: "na", and: "i" },
  en: { for: "for", and: "and" },
  de: { for: "für", and: "und" },
  fr: { for: "pour", and: "et" },
  es: { for: "para", and: "y" },
  it: { for: "per", and: "e" },
  cs: { for: "na", and: "a" },
  ru: { for: "для", and: "и" },
  uk: { for: "для", and: "і" },
  be: { for: "для", and: "і" },
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Display names: first letter uppercase (match list-from-AI style). */
function capitalizeProductName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;
  const chars = Array.from(trimmed);
  chars[0] = chars[0]!.toLocaleUpperCase();
  return chars.join("");
}

export function noteForMeals(
  titles: string[],
  language: AiOutputLanguage,
): string | null {
  if (titles.length <= 1) return null;
  const { for: forPrefix, and: andJoiner } = MEAL_NOTE_LOCALE[language];
  return `${forPrefix} ${titles.join(` ${andJoiner} `)}`;
}

function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Every amount stays, a repeated one too: two dishes with 500 g each need
 * 1 kg, so "500 g + 500 g". Amounts are not added up, because "2 puszki" and
 * "1 puszka" or "1 kg" and "500 g" have no safe sum.
 */
export function joinAmounts(
  amounts: readonly (string | null | undefined)[],
): string | null {
  const kept = amounts
    .map(text)
    .filter((amount): amount is string => amount !== null);
  return kept.length > 0 ? kept.join(" + ") : null;
}

/**
 * Every note stays, but a part already written ("dojrzałe", "na A i B") is not
 * written again. Parts are split at ";", the way the notes are joined.
 */
export function joinNotes(
  notes: readonly (string | null | undefined)[],
): string | null {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const note of notes) {
    for (const part of (note ?? "").split(";")) {
      const value = text(part);
      if (!value) continue;
      const key = value.toLowerCase().replace(/\s+/g, " ");
      if (seen.has(key)) continue;
      seen.add(key);
      kept.push(value);
    }
  }
  return kept.length > 0 ? kept.join("; ") : null;
}

/**
 * An amount too long for an item goes to the front of the note instead, so no
 * part of it is cut off.
 */
export function fitAmount(
  amount: string | null,
  note: string | null,
): { amount: string | null; note: string | null } {
  if (amount === null || amount.length <= MAX_AMOUNT_CHARS) {
    return { amount, note };
  }
  return { amount: null, note: joinNotes([amount, note]) };
}

type JoinedIngredient = {
  ownerMealId: string;
  proposalRowId: string;
  name: string;
  category: MealProposalOperation["category"];
  confidence: number;
  mealTitles: string[];
  amounts: (string | null)[];
  notes: (string | null)[];
};

/** One operation per ingredient. The first dish that lists it owns the row. */
export function mealIngredientOperations(
  meals: readonly Meal[],
  listItems: readonly ListItem[],
  language: AiOutputLanguage,
): MealProposalOperation[] {
  const byName = new Map<string, JoinedIngredient>();

  for (const meal of meals) {
    for (const ingredient of meal.ingredients) {
      const key = normalizeName(ingredient.name);
      if (!key) continue;
      const confidence = ingredient.confidence ?? 0.8;
      const joined = byName.get(key);
      if (!joined) {
        byName.set(key, {
          ownerMealId: meal.mealId,
          proposalRowId: ingredient.proposalRowId,
          name: capitalizeProductName(ingredient.name),
          category: ingredient.category,
          confidence,
          mealTitles: [meal.title],
          amounts: [ingredient.amount ?? null],
          notes: [ingredient.note ?? null],
        });
        continue;
      }
      if (!joined.mealTitles.includes(meal.title)) {
        joined.mealTitles.push(meal.title);
      }
      joined.amounts.push(ingredient.amount ?? null);
      joined.notes.push(ingredient.note ?? null);
      joined.confidence = Math.max(joined.confidence, confidence);
    }
  }

  return [...byName.values()].map((joined): MealProposalOperation => {
    const sharedNote = noteForMeals(joined.mealTitles, language);
    const amount = joinAmounts(joined.amounts);
    const note = joinNotes([...joined.notes, sharedNote]);

    const match = listItems.find(
      (item) =>
        item.status !== "removed" &&
        normalizeName(item.name) === normalizeName(joined.name),
    );

    if (match) {
      const merged = fitAmount(
        joinAmounts([match.amount, amount]),
        joinNotes([match.note, note]),
      );
      return {
        proposalRowId: joined.proposalRowId,
        ownerMealId: joined.ownerMealId,
        op: "merge",
        targetItemId: match.id,
        clientId: null,
        name: match.name,
        amount: merged.amount,
        note: merged.note,
        category: joined.category,
        confidence: Math.max(joined.confidence, 0.85),
        reason: sharedNote ? "deduped across meals + list" : "matched list item",
      };
    }

    const created = fitAmount(amount, note);
    return {
      proposalRowId: joined.proposalRowId,
      ownerMealId: joined.ownerMealId,
      op: "create",
      targetItemId: null,
      clientId: null,
      name: joined.name,
      amount: created.amount,
      note: created.note,
      category: joined.category,
      confidence: joined.confidence,
      reason: sharedNote ? "deduped across meals" : null,
    };
  });
}
