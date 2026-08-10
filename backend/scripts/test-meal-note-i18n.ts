/**
 * Smoke asserts for localized cross-meal ingredient notes.
 * Run: pnpm exec tsx scripts/test-meal-note-i18n.ts
 */

import assert from "node:assert/strict";

import {
  dedupeMealIngredients,
  noteForMeals,
} from "../features/ai/dedupeMealIngredients";
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

{
  const proposal = dedupeMealIngredients(fixture, [], "de");
  const salt = proposal.operations.find((op) => op.name === "Salz");
  assert.ok(salt);
  assert.equal(salt!.note, "für Penne Carbonara und Beef Wellington");
  assert.doesNotMatch(salt!.note ?? "", /\bna\b|\bi\b/);
}

{
  const proposal = dedupeMealIngredients(fixture, [], "en");
  const salt = proposal.operations.find((op) => op.name === "Salz");
  assert.equal(salt!.note, "for Penne Carbonara and Beef Wellington");
}

{
  const empty: MealProposalAiResponse = { meals: [] };
  const proposal = dedupeMealIngredients(empty, [], "de");
  assert.ok(proposal.shoppingContext);
  assert.equal(proposal.shoppingContext.title, "Einkauf");
}

console.log("ok: meal note i18n");
