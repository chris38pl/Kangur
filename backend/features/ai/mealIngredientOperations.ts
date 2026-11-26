/**
 * The ingredients of a meal proposal: one row per dish while the user reviews
 * the dishes, one item per ingredient when the proposal is applied.
 *
 * The review screen shows one dish per page, with the rows whose `ownerMealId`
 * is that dish. So each dish has its own row of an ingredient, with its own
 * amount and note: pasta is on the Spaghetti page with 500 g and on the
 * Lasagne page with 400 g. The user keeps or drops rows and whole dishes there.
 *
 * At apply, the kept rows of one ingredient become one item. The item keeps
 * every kept amount ("500 g + 400 g", and "500 g + 500 g" when two dishes need
 * 500 g each) and every kept note, and the note "na A i B" names the kept
 * dishes only. Dropping Spaghetti leaves pasta with 400 g for Lasagne. A row
 * that merges into an item already on the list keeps the item's amount and
 * note and adds the kept dishes' after them.
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

type Category = MealProposalOperation["category"];

/**
 * Meal runs store one row per dish since this proposal version. Older runs
 * hold one row per ingredient, already joined, and are applied as stored.
 */
export const MEAL_ROWS_PER_DISH_VERSION = 2;

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

/** What every dish's row of one ingredient shares. */
type Ingredient = {
  name: string;
  category: Category;
  mealIds: Set<string>;
};

type DishRow = {
  key: string;
  ingredient: Ingredient;
  ownerMealId: string;
  proposalRowId: string;
  amounts: (string | null)[];
  notes: (string | null)[];
  confidence: number;
};

/**
 * The model writes the row ids and can repeat one in two dishes ("1" in each).
 * The app keeps and drops rows by id, so a repeated id gets the dish in front.
 */
function unusedRowId(
  wanted: string,
  mealId: string,
  used: ReadonlySet<string>,
): string {
  if (wanted && !used.has(wanted)) return wanted;
  const base = `${mealId}-${wanted || "row"}`;
  let id = base;
  for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
  return id;
}

/**
 * The rows of the proposal: one per dish and ingredient, in dish order. Every
 * row of one ingredient has the name and category of the first dish that
 * lists it, and the amount and note of its own dish. An ingredient listed
 * twice in one dish is one row of that dish with both amounts.
 */
export function mealIngredientOperations(
  meals: readonly Meal[],
  listItems: readonly ListItem[],
): MealProposalOperation[] {
  const ingredients = new Map<string, Ingredient>();
  const rows: DishRow[] = [];

  for (const meal of meals) {
    const rowsOfDish = new Map<string, DishRow>();
    for (const item of meal.ingredients) {
      const key = normalizeName(item.name);
      if (!key) continue;
      const confidence = item.confidence ?? 0.8;

      let ingredient = ingredients.get(key);
      if (!ingredient) {
        ingredient = {
          name: capitalizeProductName(item.name),
          category: item.category,
          mealIds: new Set(),
        };
        ingredients.set(key, ingredient);
      }
      ingredient.mealIds.add(meal.mealId);

      const row = rowsOfDish.get(key);
      if (row) {
        row.amounts.push(item.amount ?? null);
        row.notes.push(item.note ?? null);
        row.confidence = Math.max(row.confidence, confidence);
        continue;
      }
      const dishRow: DishRow = {
        key,
        ingredient,
        ownerMealId: meal.mealId,
        proposalRowId: item.proposalRowId,
        amounts: [item.amount ?? null],
        notes: [item.note ?? null],
        confidence,
      };
      rowsOfDish.set(key, dishRow);
      rows.push(dishRow);
    }
  }

  const usedRowIds = new Set<string>();
  return rows.map((row): MealProposalOperation => {
    const proposalRowId = unusedRowId(
      row.proposalRowId,
      row.ownerMealId,
      usedRowIds,
    );
    usedRowIds.add(proposalRowId);
    const shared = row.ingredient.mealIds.size > 1;
    const amount = joinAmounts(row.amounts);
    const note = joinNotes(row.notes);

    const match = listItems.find(
      (item) => item.status !== "removed" && normalizeName(item.name) === row.key,
    );

    if (match) {
      return {
        proposalRowId,
        ownerMealId: row.ownerMealId,
        op: "merge",
        targetItemId: match.id,
        clientId: null,
        name: match.name,
        amount,
        note,
        category: row.ingredient.category,
        confidence: Math.max(row.confidence, 0.85),
        reason: shared ? "shared across meals + list" : "matched list item",
      };
    }

    return {
      proposalRowId,
      ownerMealId: row.ownerMealId,
      op: "create",
      targetItemId: null,
      clientId: null,
      name: row.ingredient.name,
      amount,
      note,
      category: row.ingredient.category,
      confidence: row.confidence,
      reason: shared ? "shared across meals" : null,
    };
  });
}

/** A stored row of a meal proposal, as far as joining needs it. */
export type MealRow = Pick<
  MealProposalOperation,
  "proposalRowId" | "ownerMealId" | "name" | "amount" | "note" | "category"
>;

/** What the app decides for one row (the apply request body). */
export type RowDecision =
  | { op: "create"; proposalRowId: string; clientId?: string }
  | { op: "merge"; proposalRowId: string; targetItemId: string }
  | { op: "update"; proposalRowId: string }
  | { op: "ignore"; proposalRowId: string };

/** The list item a merge goes into, as it is when the proposal is applied. */
export type MergeTarget = { amount: string | null; note: string | null };

export type KeptOperation =
  | {
      op: "create";
      proposalRowId: string;
      clientId: string | undefined;
      name: string;
      amount: string | null;
      note: string | null;
      category: Category;
    }
  | {
      op: "merge";
      proposalRowId: string;
      targetItemId: string;
      name: string;
      amount: string | null;
      note: string | null;
      category: Category;
    };

type KeptGroup = { first: MealRow; rows: MealRow[] } & (
  | { op: "create"; clientId: string | undefined }
  | { op: "merge"; targetItemId: string }
);

/**
 * The rows the user kept, one operation per ingredient: the kept rows that
 * merge into one list item become one merge, the kept creates of one name one
 * create. Rows count in proposal order, whatever order the app sends them in,
 * and a row sent twice counts once. Ignored rows, updates and unknown rows
 * give nothing here.
 */
export function joinKeptMealRows(input: {
  meals: readonly { mealId: string; title: string }[];
  rows: readonly MealRow[];
  decisions: readonly RowDecision[];
  targets: ReadonlyMap<string, MergeTarget>;
  language: AiOutputLanguage;
}): KeptOperation[] {
  const decisionByRowId = new Map<string, RowDecision>();
  for (const decision of input.decisions) {
    if (!decisionByRowId.has(decision.proposalRowId)) {
      decisionByRowId.set(decision.proposalRowId, decision);
    }
  }

  const groups = new Map<string, KeptGroup>();
  for (const row of input.rows) {
    const decision = decisionByRowId.get(row.proposalRowId);
    if (decision?.op !== "create" && decision?.op !== "merge") continue;
    const key =
      decision.op === "merge"
        ? `merge:${decision.targetItemId}`
        : `create:${normalizeName(row.name)}`;
    const group = groups.get(key);
    if (group) {
      group.rows.push(row);
      continue;
    }
    groups.set(
      key,
      decision.op === "merge"
        ? {
            op: "merge",
            targetItemId: decision.targetItemId,
            first: row,
            rows: [row],
          }
        : { op: "create", clientId: decision.clientId, first: row, rows: [row] },
    );
  }

  const titleByMealId = new Map<string, string>();
  for (const meal of input.meals) {
    if (!titleByMealId.has(meal.mealId)) {
      titleByMealId.set(meal.mealId, meal.title);
    }
  }

  return [...groups.values()].map((group): KeptOperation => {
    const titles: string[] = [];
    for (const row of group.rows) {
      const title = titleByMealId.get(row.ownerMealId);
      if (title && !titles.includes(title)) titles.push(title);
    }
    const sharedNote = noteForMeals(titles, input.language);
    const amounts = group.rows.map((row) => row.amount);
    const notes = [...group.rows.map((row) => row.note), sharedNote];
    const { first } = group;

    if (group.op === "merge") {
      const target = input.targets.get(group.targetItemId);
      const merged = fitAmount(
        joinAmounts([target?.amount, ...amounts]),
        joinNotes([target?.note, ...notes]),
      );
      return {
        op: "merge",
        proposalRowId: first.proposalRowId,
        targetItemId: group.targetItemId,
        name: first.name,
        amount: merged.amount,
        note: merged.note,
        category: first.category,
      };
    }

    const created = fitAmount(joinAmounts(amounts), joinNotes(notes));
    return {
      op: "create",
      proposalRowId: first.proposalRowId,
      clientId: group.clientId,
      name: first.name,
      amount: created.amount,
      note: created.note,
      category: first.category,
    };
  });
}

/**
 * What the app sends when the user keeps every dish and row: a merge for a row
 * that merges into a list item, a create for the rest.
 */
export function keepEveryRow(
  rows: readonly Pick<
    MealProposalOperation,
    "proposalRowId" | "op" | "targetItemId"
  >[],
): RowDecision[] {
  return rows.map((row): RowDecision =>
    row.op === "merge" && row.targetItemId
      ? {
          op: "merge",
          proposalRowId: row.proposalRowId,
          targetItemId: row.targetItemId,
        }
      : { op: "create", proposalRowId: row.proposalRowId },
  );
}
