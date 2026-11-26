import type { AiOutputLanguage } from "./outputLanguage";
import { formatDefaultShoppingListTitle } from "@shared/shopping-list/default-list-title";
import { mealIngredientOperations } from "./mealIngredientOperations";
import type { MealProposal, MealProposalAiResponse } from "./schemas";

export { noteForMeals } from "./mealIngredientOperations";

type ExistingItem = {
  id: string;
  name: string;
  amount: string | null;
  note: string | null;
  category: string;
  status: string;
};

/** Fallback list title when meal titles are empty. */
function shoppingTitleFallback(language: AiOutputLanguage): string {
  return formatDefaultShoppingListTitle(language);
}

/**
 * One row per dish and ingredient, ownerMealId = that dish, so the review
 * screen shows a shared ingredient on the page of every dish that needs it.
 * applyAiProposal joins the kept rows of one ingredient into one item
 * (see mealIngredientOperations).
 */
export function dedupeMealIngredients(
  ai: MealProposalAiResponse,
  existingItems: ExistingItem[],
  outputLanguage: AiOutputLanguage = "pl",
): MealProposal {
  const meals = ai.meals.map((meal) => ({
    mealId: meal.mealId,
    title: meal.title,
    icon: meal.icon,
  }));

  const operations = mealIngredientOperations(ai.meals, existingItems);

  const title =
    meals.length === 1
      ? meals[0]!.title.slice(0, 32)
      : meals
          .map((m) => m.title)
          .join(" + ")
          .slice(0, 32);

  return {
    shoppingContext: {
      title: title || shoppingTitleFallback(outputLanguage),
      theme: "generic",
    },
    meals,
    operations,
  };
}
