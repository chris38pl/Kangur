import type {
  MealProposal,
  MealProposalAiResponse,
  MealProposalOperation,
} from "./schemas";

type ExistingItem = {
  id: string;
  name: string;
  amount: string | null;
  note: string | null;
  category: string;
  status: string;
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function noteForMeals(titles: string[]): string | null {
  if (titles.length <= 1) return null;
  return `na ${titles.join(" i ")}`;
}

function preferAmount(
  a: string | null | undefined,
  b: string | null | undefined,
): string | null {
  const left = a?.trim() || null;
  const right = b?.trim() || null;
  if (left && right && left !== right) return left;
  return left ?? right;
}

/** Cross-meal dedupe: one op per ingredient, ownerMealId = first meal. */
export function dedupeMealIngredients(
  ai: MealProposalAiResponse,
  existingItems: ExistingItem[],
): MealProposal {
  const meals = ai.meals.map((meal) => ({
    mealId: meal.mealId,
    title: meal.title,
    icon: meal.icon,
  }));

  type Acc = {
    ownerMealId: string;
    mealTitles: string[];
    name: string;
    amount: string | null;
    note: string | null;
    category: MealProposalOperation["category"];
    confidence: number;
    proposalRowId: string;
  };

  const byKey = new Map<string, Acc>();

  for (const meal of ai.meals) {
    for (const ingredient of meal.ingredients) {
      const key = normalizeName(ingredient.name);
      if (!key) continue;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          ownerMealId: meal.mealId,
          mealTitles: [meal.title],
          name: ingredient.name.trim(),
          amount: ingredient.amount?.trim() || null,
          note: ingredient.note?.trim() || null,
          category: ingredient.category,
          confidence: ingredient.confidence ?? 0.8,
          proposalRowId: ingredient.proposalRowId,
        });
        continue;
      }
      if (!existing.mealTitles.includes(meal.title)) {
        existing.mealTitles.push(meal.title);
      }
      existing.amount = preferAmount(existing.amount, ingredient.amount);
      existing.confidence = Math.max(
        existing.confidence,
        ingredient.confidence ?? 0.8,
      );
      if (!existing.note && ingredient.note?.trim()) {
        existing.note = ingredient.note.trim();
      }
    }
  }

  const operations: MealProposalOperation[] = [];

  for (const acc of byKey.values()) {
    const sharedNote = noteForMeals(acc.mealTitles);
    const note = sharedNote
      ? acc.note
        ? `${acc.note}; ${sharedNote}`
        : sharedNote
      : acc.note;

    const match = existingItems.find(
      (item) =>
        item.status !== "removed" &&
        normalizeName(item.name) === normalizeName(acc.name),
    );

    if (match) {
      operations.push({
        proposalRowId: acc.proposalRowId,
        ownerMealId: acc.ownerMealId,
        op: "merge",
        targetItemId: match.id,
        clientId: null,
        name: match.name,
        amount: preferAmount(match.amount, acc.amount),
        note: note ?? match.note,
        category: acc.category,
        confidence: Math.max(acc.confidence, 0.85),
        reason: sharedNote ? "deduped across meals + list" : "matched list item",
      });
      continue;
    }

    operations.push({
      proposalRowId: acc.proposalRowId,
      ownerMealId: acc.ownerMealId,
      op: "create",
      targetItemId: null,
      clientId: null,
      name: acc.name,
      amount: acc.amount,
      note,
      category: acc.category,
      confidence: acc.confidence,
      reason: sharedNote ? "deduped across meals" : null,
    });
  }

  const title =
    meals.length === 1
      ? meals[0]!.title.slice(0, 32)
      : meals
          .map((m) => m.title)
          .join(" + ")
          .slice(0, 32);

  return {
    shoppingContext: {
      title: title || "Zakupy",
      theme: "generic",
    },
    meals,
    operations,
  };
}
