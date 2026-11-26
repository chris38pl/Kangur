import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_AMOUNT_CHARS,
  fitAmount,
  joinAmounts,
  joinKeptMealRows,
  joinNotes,
  keepEveryRow,
  mealIngredientOperations,
  noteForMeals,
  type ListItem,
  type Meal,
  type MergeTarget,
  type RowDecision,
} from "./mealIngredientOperations.ts";
import type { AiOutputLanguage } from "./outputLanguage.ts";
import type { MealProposalOperation } from "./schemas.ts";

type Ingredient = Meal["ingredients"][number];

function ingredient(
  proposalRowId: string,
  name: string,
  amount: string | null = null,
  note: string | null = null,
  category: Ingredient["category"] = "pantry",
): Ingredient {
  return { proposalRowId, name, amount, note, category, confidence: 0.9 };
}

function meal(mealId: string, title: string, ...ingredients: Ingredient[]) {
  return { mealId, title, icon: "🍽️", ingredients } satisfies Meal;
}

const spaghetti = (...rows: Ingredient[]) =>
  meal("spaghetti", "Spaghetti", ...rows);
const lasagne = (...rows: Ingredient[]) => meal("lasagne", "Lasagne", ...rows);
const pizza = (...rows: Ingredient[]) => meal("pizza", "Pizza", ...rows);

function listItem(
  id: string,
  name: string,
  amount: string | null = null,
  note: string | null = null,
  status = "pending",
): ListItem {
  return { id, name, amount, note, status };
}

/** The rows of one dish's page, picked the way the review screen picks them. */
function pageOf(rows: MealProposalOperation[], mealId: string) {
  return rows.filter((row) => row.ownerMealId === mealId);
}

/**
 * The request app 1.0.8 sends (meal-proposal-review-screen.tsx): each kept row
 * as a merge when it merges and a create otherwise, then every other row as
 * ignore.
 */
function appDecisions(
  rows: MealProposalOperation[],
  keptRowIds: ReadonlySet<string>,
): RowDecision[] {
  const kept = rows
    .filter((row) => keptRowIds.has(row.proposalRowId))
    .map(
      (row): RowDecision =>
        row.op === "merge" && row.targetItemId
          ? {
              op: "merge",
              proposalRowId: row.proposalRowId,
              targetItemId: row.targetItemId,
            }
          : { op: "create", proposalRowId: row.proposalRowId },
    );
  const ignored = rows
    .filter((row) => !keptRowIds.has(row.proposalRowId))
    .map(
      (row): RowDecision => ({ op: "ignore", proposalRowId: row.proposalRowId }),
    );
  return [...kept, ...ignored];
}

type Review = {
  /** The dishes the user adds; the rest are rejected. Every dish by default. */
  keep?: string[];
  /** Rows the user unchecks on the page of a kept dish. */
  uncheck?: string[];
  listItems?: ListItem[];
  /** The list items when the user applies, if they changed during the review. */
  itemsAtApply?: Map<string, MergeTarget>;
  language?: AiOutputLanguage;
};

/** Reviews the dishes the way the app does and applies: what lands on the list. */
function apply(meals: Meal[], review: Review = {}) {
  const listItems = review.listItems ?? [];
  const rows = mealIngredientOperations(meals, listItems);
  const keep = new Set(review.keep ?? meals.map((dish) => dish.mealId));
  const uncheck = new Set(review.uncheck ?? []);
  const keptRowIds = new Set(
    rows
      .filter(
        (row) => keep.has(row.ownerMealId) && !uncheck.has(row.proposalRowId),
      )
      .map((row) => row.proposalRowId),
  );
  return joinKeptMealRows({
    meals,
    rows,
    decisions: appDecisions(rows, keptRowIds),
    targets:
      review.itemsAtApply ?? new Map(listItems.map((item) => [item.id, item])),
    language: review.language ?? "pl",
  });
}

/** The only item that lands on the list. */
function onlyItem(meals: Meal[], review: Review = {}) {
  const items = apply(meals, review);
  assert.equal(items.length, 1);
  return items[0]!;
}

/** Name, amount and note of each item that lands on the list. */
function itemTexts(meals: Meal[], review: Review = {}) {
  return apply(meals, review).map((item) => [item.name, item.amount, item.note]);
}

// The review screen: each dish has its own row of an ingredient.

test("a shared ingredient is on the page of every dish that lists it", () => {
  const rows = mealIngredientOperations(
    [
      spaghetti(
        ingredient("s1", "Makaron", "500 g"),
        ingredient("s2", "Pomidory"),
      ),
      lasagne(ingredient("l1", "Makaron", "400 g"), ingredient("l2", "Ser")),
    ],
    [],
  );
  const texts = (mealId: string) =>
    pageOf(rows, mealId).map((row) => [row.name, row.amount, row.note]);
  assert.deepEqual(texts("spaghetti"), [
    ["Makaron", "500 g", null],
    ["Pomidory", null, null],
  ]);
  assert.deepEqual(texts("lasagne"), [
    ["Makaron", "400 g", null],
    ["Ser", null, null],
  ]);
  assert.deepEqual(
    rows.map((row) => row.proposalRowId),
    ["s1", "s2", "l1", "l2"],
  );
});

test("every dish's row has the name and category of the first dish", () => {
  const rows = mealIngredientOperations(
    [
      spaghetti(ingredient("s1", "makaron", "500 g", null, "pantry")),
      lasagne(ingredient("l1", "  MAKARON ", "400 g", null, "other")),
    ],
    [],
  );
  assert.deepEqual(
    rows.map((row) => [row.ownerMealId, row.name, row.category]),
    [
      ["spaghetti", "Makaron", "pantry"],
      ["lasagne", "Makaron", "pantry"],
    ],
  );
});

test("one dish listing an ingredient twice has one row with both amounts", () => {
  const rows = mealIngredientOperations(
    [lasagne(ingredient("l1", "Ser", "100 g"), ingredient("l2", "ser", "50 g"))],
    [],
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.proposalRowId, "l1");
  assert.equal(rows[0]!.name, "Ser");
  assert.equal(rows[0]!.amount, "100 g + 50 g");
});

test("a row id the model repeats in another dish gets the dish in front", () => {
  const rows = mealIngredientOperations(
    [
      spaghetti(ingredient("1", "Makaron"), ingredient("2", "Pomidory")),
      lasagne(ingredient("1", "Makaron"), ingredient("2", "Ser")),
      pizza(ingredient("", "Mąka"), ingredient("", "Drożdże")),
    ],
    [],
  );
  assert.deepEqual(
    rows.map((row) => row.proposalRowId),
    ["1", "2", "lasagne-1", "lasagne-2", "pizza-row", "pizza-row-2"],
  );
});

test("a merge row on a dish's page shows that dish's amount", () => {
  const rows = mealIngredientOperations(
    [spaghetti(ingredient("s1", "Makaron", "500 g"))],
    [listItem("item-1", "makaron", "1 kg")],
  );
  assert.equal(rows.length, 1);
  const [row] = rows;
  assert.equal(row!.op, "merge");
  assert.equal(row!.targetItemId, "item-1");
  assert.equal(row!.name, "makaron");
  assert.equal(row!.amount, "500 g");
  assert.equal(row!.note, null);
});

test("a removed list item is not merged into", () => {
  const rows = mealIngredientOperations(
    [spaghetti(ingredient("s1", "Makaron", "500 g"))],
    [listItem("item-1", "Makaron", "1 kg", null, "removed")],
  );
  assert.equal(rows[0]!.op, "create");
  assert.deepEqual(
    itemTexts([spaghetti(ingredient("s1", "Makaron", "500 g"))], {
      listItems: [listItem("item-1", "Makaron", "1 kg", null, "removed")],
    }),
    [["Makaron", "500 g", null]],
  );
});

// Apply: the kept rows of one ingredient become one item.

test("keeping both dishes joins both amounts and names both dishes", () => {
  const item = onlyItem([
    spaghetti(ingredient("s1", "Makaron", "500 g")),
    lasagne(ingredient("l1", "Makaron", "400 g")),
  ]);
  assert.deepEqual(item, {
    op: "create",
    proposalRowId: "s1",
    clientId: undefined,
    name: "Makaron",
    amount: "500 g + 400 g",
    note: "na Spaghetti i Lasagne",
    category: "pantry",
  });
});

test("rejecting the first dish keeps the ingredient with the later dish's amount", () => {
  const meals = [
    spaghetti(
      ingredient("s1", "Makaron", "500 g"),
      ingredient("s2", "Pomidory", "1 puszka"),
    ),
    lasagne(
      ingredient("l1", "Makaron", "400 g"),
      ingredient("l2", "Ser", "200 g"),
    ),
  ];
  assert.deepEqual(itemTexts(meals, { keep: ["lasagne"] }), [
    ["Makaron", "400 g", null],
    ["Ser", "200 g", null],
  ]);
});

test("rejecting a later dish removes that dish's amount and title", () => {
  const meals = [
    spaghetti(ingredient("s1", "Cebula", "1 szt.")),
    lasagne(ingredient("l1", "Cebula", "2 szt.")),
    pizza(ingredient("p1", "Cebula", "3 szt.")),
  ];
  const item = onlyItem(meals, { keep: ["spaghetti", "lasagne"] });
  assert.equal(item.amount, "1 szt. + 2 szt.");
  assert.equal(item.note, "na Spaghetti i Lasagne");
});

test("rejecting the later of two dishes drops its amount and note", () => {
  const item = onlyItem(
    [
      spaghetti(ingredient("s1", "Makaron", "500 g", "pełnoziarnisty")),
      lasagne(ingredient("l1", "Makaron", "400 g", "do zapiekania")),
    ],
    { keep: ["spaghetti"] },
  );
  assert.equal(item.amount, "500 g");
  assert.equal(item.note, "pełnoziarnisty");
});

test("rejecting the middle dish keeps the first and the last", () => {
  const item = onlyItem(
    [
      spaghetti(ingredient("s1", "Cebula", "1 szt.")),
      lasagne(ingredient("l1", "Cebula", "2 szt.")),
      pizza(ingredient("p1", "Cebula", "3 szt.")),
    ],
    { keep: ["spaghetti", "pizza"] },
  );
  assert.equal(item.amount, "1 szt. + 3 szt.");
  assert.equal(item.note, "na Spaghetti i Pizza");
});

test("unchecking the ingredient on a kept dish's page drops that dish's share", () => {
  const item = onlyItem(
    [
      spaghetti(ingredient("s1", "Makaron", "500 g")),
      lasagne(ingredient("l1", "Makaron", "400 g")),
    ],
    { uncheck: ["s1"] },
  );
  assert.equal(item.amount, "400 g");
  assert.equal(item.note, null);
});

test("rejecting every dish that needs an ingredient leaves it off the list", () => {
  const meals = [
    spaghetti(ingredient("s1", "Makaron", "500 g")),
    lasagne(ingredient("l1", "Makaron", "400 g")),
    pizza(ingredient("p1", "Mąka", "1 kg")),
  ];
  assert.deepEqual(itemTexts(meals, { keep: ["pizza"] }), [
    ["Mąka", "1 kg", null],
  ]);
});

test("items come in the order of their first kept row", () => {
  const meals = [
    spaghetti(ingredient("s1", "Makaron"), ingredient("s2", "Pomidory")),
    lasagne(ingredient("l1", "Ser"), ingredient("l2", "Makaron")),
  ];
  assert.deepEqual(
    apply(meals).map((item) => item.name),
    ["Makaron", "Pomidory", "Ser"],
  );
  assert.deepEqual(
    apply(meals, { keep: ["lasagne"] }).map((item) => item.name),
    ["Ser", "Makaron"],
  );
});

test("rows count in proposal order, whatever order the app sends them in", () => {
  const meals = [
    spaghetti(ingredient("s1", "Makaron", "500 g")),
    lasagne(ingredient("l1", "Makaron", "400 g")),
  ];
  const rows = mealIngredientOperations(meals, []);
  const [item] = joinKeptMealRows({
    meals,
    rows,
    decisions: keepEveryRow(rows).reverse(),
    targets: new Map(),
    language: "pl",
  });
  assert.equal(item!.proposalRowId, "s1");
  assert.equal(item!.amount, "500 g + 400 g");
  assert.equal(item!.note, "na Spaghetti i Lasagne");
});

test("a row sent twice counts once", () => {
  const meals = [
    spaghetti(ingredient("s1", "Makaron", "500 g")),
    lasagne(ingredient("l1", "Makaron", "400 g")),
  ];
  const rows = mealIngredientOperations(meals, []);
  const items = joinKeptMealRows({
    meals,
    rows,
    decisions: [...keepEveryRow(rows), ...keepEveryRow(rows)],
    targets: new Map(),
    language: "pl",
  });
  assert.equal(items.length, 1);
  assert.equal(items[0]!.amount, "500 g + 400 g");
});

test("ignored, updated and unknown rows give no item", () => {
  const meals = [
    spaghetti(ingredient("s1", "Makaron", "500 g")),
    lasagne(ingredient("l1", "Ser")),
  ];
  const items = joinKeptMealRows({
    meals,
    rows: mealIngredientOperations(meals, []),
    decisions: [
      { op: "ignore", proposalRowId: "s1" },
      { op: "update", proposalRowId: "l1" },
      { op: "create", proposalRowId: "no-such-row" },
    ],
    targets: new Map(),
    language: "pl",
  });
  assert.deepEqual(items, []);
});

test("a joined create keeps the client id of its first kept row", () => {
  const meals = [
    spaghetti(ingredient("s1", "Makaron", "500 g")),
    lasagne(ingredient("l1", "Makaron", "400 g")),
  ];
  const [item] = joinKeptMealRows({
    meals,
    rows: mealIngredientOperations(meals, []),
    decisions: [
      { op: "create", proposalRowId: "l1", clientId: "client-l1" },
      { op: "create", proposalRowId: "s1", clientId: "client-s1" },
    ],
    targets: new Map(),
    language: "pl",
  });
  assert.equal(item!.op, "create");
  assert.equal(item!.op === "create" ? item!.clientId : null, "client-s1");
});

test("keepEveryRow sends what the app sends when every row is kept", () => {
  const rows = mealIngredientOperations(
    [
      spaghetti(ingredient("s1", "Makaron", "500 g")),
      lasagne(ingredient("l1", "Makaron", "400 g"), ingredient("l2", "Ser")),
    ],
    [listItem("item-1", "Makaron", "1 kg")],
  );
  const everyRowId = new Set(rows.map((row) => row.proposalRowId));
  assert.deepEqual(keepEveryRow(rows), appDecisions(rows, everyRowId));
});

// Joined amounts and notes of kept rows.

test("the same amount in two dishes is kept twice", () => {
  const item = onlyItem([
    spaghetti(ingredient("s1", "Mięso mielone", "500 g")),
    lasagne(ingredient("l1", "Mięso mielone", "500 g")),
  ]);
  assert.equal(item.amount, "500 g + 500 g");
});

test("three dishes keep three amounts in dish order", () => {
  const item = onlyItem([
    spaghetti(ingredient("s1", "Cebula", "1 szt.")),
    lasagne(ingredient("l1", "Cebula", "2 szt.")),
    pizza(ingredient("p1", "Cebula", "1 szt.")),
  ]);
  assert.equal(item.amount, "1 szt. + 2 szt. + 1 szt.");
  assert.equal(item.note, "na Spaghetti i Lasagne i Pizza");
});

test("an amount given by one dish only is kept", () => {
  const item = onlyItem([
    spaghetti(ingredient("s1", "Makaron")),
    lasagne(ingredient("l1", "Makaron", "400 g")),
  ]);
  assert.equal(item.amount, "400 g");
});

test("no amount in any dish leaves the amount empty", () => {
  const item = onlyItem([
    spaghetti(ingredient("s1", "Sól")),
    lasagne(ingredient("l1", "Sól")),
  ]);
  assert.equal(item.amount, null);
  assert.equal(item.note, "na Spaghetti i Lasagne");
});

test("one dish listing an ingredient twice keeps both amounts", () => {
  const item = onlyItem([
    lasagne(ingredient("l1", "Ser", "100 g"), ingredient("l2", "ser", "50 g")),
  ]);
  assert.equal(item.amount, "100 g + 50 g");
  assert.equal(item.note, null);
  assert.equal(item.name, "Ser");
});

test("case and spaces do not split one ingredient into two items", () => {
  const item = onlyItem([
    spaghetti(ingredient("s1", "makaron", "500 g")),
    lasagne(ingredient("l1", "  Makaron ", "400 g")),
  ]);
  assert.equal(item.name, "Makaron");
  assert.equal(item.amount, "500 g + 400 g");
});

test("different notes of the dishes are all kept", () => {
  const item = onlyItem([
    spaghetti(ingredient("s1", "Pomidory", "4 szt.", "dojrzałe")),
    lasagne(ingredient("l1", "Pomidory", "2 szt.", "koktajlowe")),
  ]);
  assert.equal(item.amount, "4 szt. + 2 szt.");
  assert.equal(item.note, "dojrzałe; koktajlowe; na Spaghetti i Lasagne");
});

test("the same note from two dishes is written once", () => {
  const item = onlyItem([
    spaghetti(ingredient("s1", "Pomidory", null, "dojrzałe")),
    lasagne(ingredient("l1", "Pomidory", null, " Dojrzałe ")),
  ]);
  assert.equal(item.note, "dojrzałe; na Spaghetti i Lasagne");
});

// Kept rows that merge into an item already on the list.

test("a merge keeps the list item's amount and adds the dish's", () => {
  const item = onlyItem([spaghetti(ingredient("s1", "Makaron", "500 g"))], {
    listItems: [listItem("item-1", "makaron", "1 kg")],
  });
  assert.equal(item.op, "merge");
  assert.equal(item.op === "merge" ? item.targetItemId : null, "item-1");
  assert.equal(item.name, "makaron");
  assert.equal(item.amount, "1 kg + 500 g");
  assert.equal(item.note, null);
});

test("a merge into an item without an amount takes the dish's", () => {
  const item = onlyItem(
    [meal("owsianka", "Owsianka", ingredient("o1", "Mleko", "1 l"))],
    { listItems: [listItem("item-1", "Mleko")] },
  );
  assert.equal(item.op, "merge");
  assert.equal(item.amount, "1 l");
});

test("a merge without a dish amount leaves the item's amount", () => {
  const item = onlyItem([spaghetti(ingredient("s1", "Makaron"))], {
    listItems: [listItem("item-1", "Makaron", "1 kg", "pełnoziarnisty")],
  });
  assert.equal(item.amount, "1 kg");
  assert.equal(item.note, "pełnoziarnisty");
});

test("a merge of two kept dishes keeps the item's amount and note", () => {
  const item = onlyItem(
    [
      spaghetti(ingredient("s1", "Makaron", "500 g")),
      lasagne(ingredient("l1", "Makaron", "400 g")),
    ],
    { listItems: [listItem("item-1", "Makaron", "1 kg", "pełnoziarnisty")] },
  );
  assert.equal(item.op, "merge");
  assert.equal(item.amount, "1 kg + 500 g + 400 g");
  assert.equal(item.note, "pełnoziarnisty; na Spaghetti i Lasagne");
});

test("a merge with the first dish rejected adds only the later dish's amount", () => {
  const item = onlyItem(
    [
      spaghetti(ingredient("s1", "Makaron", "500 g")),
      lasagne(ingredient("l1", "Makaron", "400 g")),
    ],
    {
      keep: ["lasagne"],
      listItems: [listItem("item-1", "Makaron", "1 kg", "pełnoziarnisty")],
    },
  );
  assert.equal(item.op, "merge");
  assert.equal(item.proposalRowId, "l1");
  assert.equal(item.amount, "1 kg + 400 g");
  assert.equal(item.note, "pełnoziarnisty");
});

test("a merge joins with the list item as it is at apply", () => {
  const item = onlyItem([spaghetti(ingredient("s1", "Makaron", "500 g"))], {
    listItems: [listItem("item-1", "Makaron", "1 kg")],
    itemsAtApply: new Map([["item-1", { amount: "2 kg", note: "bez glutenu" }]]),
  });
  assert.equal(item.amount, "2 kg + 500 g");
  assert.equal(item.note, "bez glutenu");
});

test("the same dishes again add their amounts but not their note", () => {
  const item = onlyItem(
    [
      spaghetti(ingredient("s1", "Makaron", "500 g")),
      lasagne(ingredient("l1", "Makaron", "400 g")),
    ],
    {
      listItems: [
        listItem(
          "item-1",
          "Makaron",
          "500 g + 400 g",
          "pełnoziarnisty; na Spaghetti i Lasagne",
        ),
      ],
    },
  );
  assert.equal(item.amount, "500 g + 400 g + 500 g + 400 g");
  assert.equal(item.note, "pełnoziarnisty; na Spaghetti i Lasagne");
});

// Amounts too long for an item.

const soups = ["Zupa", "Gulasz", "Leczo", "Bigos", "Pierogi"].map(
  (title, index) =>
    meal(
      `m${index}`,
      title,
      ingredient(`r${index}`, "Koncentrat", "1 opakowanie"),
    ),
);

test("amounts too long for an item move whole to the front of the note", () => {
  const item = onlyItem(soups);
  const allAmounts = Array(5).fill("1 opakowanie").join(" + ");
  assert.ok(allAmounts.length > MAX_AMOUNT_CHARS);
  assert.equal(item.amount, null);
  assert.equal(
    item.note,
    `${allAmounts}; na Zupa i Gulasz i Leczo i Bigos i Pierogi`,
  );
});

test("rejecting dishes can bring the amounts back under the item limit", () => {
  const item = onlyItem(soups, { keep: ["m0", "m1"] });
  assert.equal(item.amount, "1 opakowanie + 1 opakowanie");
  assert.equal(item.note, "na Zupa i Gulasz");
});

test("an amount of exactly the item limit stays an amount", () => {
  const amount = "x".repeat(MAX_AMOUNT_CHARS);
  assert.deepEqual(fitAmount(amount, "uwaga"), { amount, note: "uwaga" });
  assert.deepEqual(fitAmount(`${amount}x`, "uwaga"), {
    amount: null,
    note: `${amount}x; uwaga`,
  });
  assert.deepEqual(fitAmount(null, null), { amount: null, note: null });
});

test("joinAmounts skips blanks and keeps the rest in order", () => {
  assert.equal(
    joinAmounts([" ", null, undefined, " 500 g ", "1 kg"]),
    "500 g + 1 kg",
  );
  assert.equal(joinAmounts([null, ""]), null);
});

test("joinNotes keeps each part once, whatever the case and spaces", () => {
  assert.equal(joinNotes(["a; b", "B", "  c  ", null]), "a; b; c");
  assert.equal(joinNotes([" ; ", null]), null);
});

test("the dish note uses the list language", () => {
  const meals = [
    meal("carbonara", "Penne Carbonara", ingredient("c1", "Salz")),
    meal("wellington", "Beef Wellington", ingredient("w1", "Salz")),
  ];
  assert.equal(
    onlyItem(meals, { language: "de" }).note,
    "für Penne Carbonara und Beef Wellington",
  );
  assert.equal(
    onlyItem(meals, { language: "en" }).note,
    "for Penne Carbonara and Beef Wellington",
  );
  assert.equal(noteForMeals(["Carbonara"], "pl"), null);
});
