/**
 * Smoke asserts for localized cross-meal ingredient notes.
 * Run: pnpm exec tsx scripts/test-meal-note-i18n.ts
 */

import assert from "node:assert/strict";

import {
  dedupeMealIngredients,
  noteForMeals,
} from "../features/ai/dedupeMealIngredients";
import {
  joinKeptMealRows,
  keepEveryRow,
} from "../features/ai/mealIngredientOperations";
import type { AiOutputLanguage } from "../features/ai/outputLanguage";
import type { MealProposalAiResponse } from "../features/ai/schemas";

assert.equal(noteForMeals(["Carbonara"], "pl"), null);
assert.equal(
  noteForMeals(["Penne Carbonara", "Beef Wellington"], "pl"),
  "na Penne Carbonara i Beef Wellington",
);
assert.equal(
  noteForMeals(["Penne Carbonara", "Beef Wellington"], "de"),
  "für Penne Carbonara und Beef Wellington",
);
assert.equal(
  noteForMeals(["Penne Carbonara", "Beef Wellington"], "en"),
  "for Penne Carbonara and Beef Wellington",
);
assert.equal(
  noteForMeals(["Pizza", "Lasagne", "Risotto"], "fr"),
  "pour Pizza et Lasagne et Risotto",
);
assert.equal(
  noteForMeals(["Pizza", "Lasagne"], "uk"),
  "для Pizza і Lasagne",
);

const fixture: MealProposalAiResponse = {
  meals: [
    {
      mealId: "carbonara",
      title: "Penne Carbonara",
      icon: "🍝",
      ingredients: [
        {
          proposalRowId: "c1",
          name: "Salz",
          amount: null,
          note: null,
          category: "other",
          confidence: 0.9,
        },
      ],
    },
    {
      mealId: "wellington",
      title: "Beef Wellington",
      icon: "🥩",
      ingredients: [
        {
          proposalRowId: "w1",
          name: "Salz",
          amount: null,
          note: null,
          category: "other",
          confidence: 0.9,
        },
      ],
    },
  ],
};

/** The salt item when both dishes are kept: one row per dish, joined at apply. */
function saltWhenBothDishesAreKept(language: AiOutputLanguage) {
  const proposal = dedupeMealIngredients(fixture, [], language);
  const items = joinKeptMealRows({
    meals: proposal.meals,
    rows: proposal.operations,
    decisions: keepEveryRow(proposal.operations),
    targets: new Map(),
    language,
  });
  return items.find((op) => op.name === "Salz");
}

{
  const salt = saltWhenBothDishesAreKept("de");
  assert.ok(salt);
  assert.equal(salt!.note, "für Penne Carbonara und Beef Wellington");
  assert.doesNotMatch(salt!.note ?? "", /\bna\b|\bi\b/);
}

{
  const salt = saltWhenBothDishesAreKept("en");
  assert.equal(salt!.note, "for Penne Carbonara and Beef Wellington");
}

{
  const empty: MealProposalAiResponse = { meals: [] };
  const proposal = dedupeMealIngredients(empty, [], "de");
  assert.ok(proposal.shoppingContext);
  assert.equal(proposal.shoppingContext.title, "Einkauf");
}

console.log("ok: meal note i18n");
