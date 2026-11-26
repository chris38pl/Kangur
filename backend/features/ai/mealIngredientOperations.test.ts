import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_AMOUNT_CHARS,
  fitAmount,
  joinAmounts,
  joinNotes,
  mealIngredientOperations,
  noteForMeals,
  type ListItem,
  type Meal,
} from "./mealIngredientOperations.ts";

type Ingredient = Meal["ingredients"][number];

function ingredient(
  proposalRowId: string,
  name: string,
  amount: string | null = null,
  note: string | null = null,
): Ingredient {
  return {
    proposalRowId,
    name,
    amount,
    note,
    category: "pantry",
    confidence: 0.9,
  };
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

/** The only operation of a proposal. */
function onlyRow(meals: Meal[], listItems: ListItem[] = []) {
  const operations = mealIngredientOperations(meals, listItems, "pl");
  assert.equal(operations.length, 1);
  return operations[0]!;
}

test("one ingredient in two dishes keeps both amounts", () => {
  const row = onlyRow([
    spaghetti(ingredient("s1", "Makaron", "500 g")),
    lasagne(ingredient("l1", "Makaron", "400 g")),
  ]);
  assert.equal(row.op, "create");
  assert.equal(row.amount, "500 g + 400 g");
  assert.equal(row.note, "na Spaghetti i Lasagne");
  assert.equal(row.ownerMealId, "spaghetti");
  assert.equal(row.proposalRowId, "s1");
});

test("the same amount in two dishes is kept twice", () => {
  const row = onlyRow([
    spaghetti(ingredient("s1", "Mięso mielone", "500 g")),
    lasagne(ingredient("l1", "Mięso mielone", "500 g")),
  ]);
  assert.equal(row.amount, "500 g + 500 g");
});

test("three dishes keep three amounts in dish order", () => {
  const row = onlyRow([
    spaghetti(ingredient("s1", "Cebula", "1 szt.")),
    lasagne(ingredient("l1", "Cebula", "2 szt.")),
    pizza(ingredient("p1", "Cebula", "1 szt.")),
  ]);
  assert.equal(row.amount, "1 szt. + 2 szt. + 1 szt.");
  assert.equal(row.note, "na Spaghetti i Lasagne i Pizza");
});

test("an amount given by one dish only is kept", () => {
  const row = onlyRow([
    spaghetti(ingredient("s1", "Makaron")),
    lasagne(ingredient("l1", "Makaron", "400 g")),
  ]);
  assert.equal(row.amount, "400 g");
});

test("no amount in any dish leaves the amount empty", () => {
  const row = onlyRow([
    spaghetti(ingredient("s1", "Sól")),
    lasagne(ingredient("l1", "Sól")),
  ]);
  assert.equal(row.amount, null);
  assert.equal(row.note, "na Spaghetti i Lasagne");
});

test("one dish listing an ingredient twice keeps both amounts", () => {
  const row = onlyRow([
    lasagne(ingredient("l1", "Ser", "100 g"), ingredient("l2", "ser", "50 g")),
  ]);
  assert.equal(row.amount, "100 g + 50 g");
  assert.equal(row.note, null);
  assert.equal(row.name, "Ser");
});

test("case and spaces do not split one ingredient into two rows", () => {
  const row = onlyRow([
    spaghetti(ingredient("s1", "makaron", "500 g")),
    lasagne(ingredient("l1", "  Makaron ", "400 g")),
  ]);
  assert.equal(row.name, "Makaron");
  assert.equal(row.amount, "500 g + 400 g");
});

test("different notes of the dishes are all kept", () => {
  const row = onlyRow([
    spaghetti(ingredient("s1", "Pomidory", "4 szt.", "dojrzałe")),
    lasagne(ingredient("l1", "Pomidory", "2 szt.", "koktajlowe")),
  ]);
  assert.equal(row.amount, "4 szt. + 2 szt.");
  assert.equal(row.note, "dojrzałe; koktajlowe; na Spaghetti i Lasagne");
});

test("the same note from two dishes is written once", () => {
  const row = onlyRow([
    spaghetti(ingredient("s1", "Pomidory", null, "dojrzałe")),
    lasagne(ingredient("l1", "Pomidory", null, " Dojrzałe ")),
  ]);
  assert.equal(row.note, "dojrzałe; na Spaghetti i Lasagne");
});

test("a merge keeps the list item's amount and adds the dish's", () => {
  const row = onlyRow(
    [spaghetti(ingredient("s1", "Makaron", "500 g"))],
    [listItem("item-1", "makaron", "1 kg")],
  );
  assert.equal(row.op, "merge");
  assert.equal(row.targetItemId, "item-1");
  assert.equal(row.name, "makaron");
  assert.equal(row.amount, "1 kg + 500 g");
  assert.equal(row.note, null);
});

test("a merge into an item without an amount takes the dish's", () => {
  const row = onlyRow(
    [meal("owsianka", "Owsianka", ingredient("o1", "Mleko", "1 l"))],
    [listItem("item-1", "Mleko")],
  );
  assert.equal(row.op, "merge");
  assert.equal(row.amount, "1 l");
});

test("a merge without a dish amount leaves the item's amount", () => {
  const row = onlyRow(
    [spaghetti(ingredient("s1", "Makaron"))],
    [listItem("item-1", "Makaron", "1 kg", "pełnoziarnisty")],
  );
  assert.equal(row.amount, "1 kg");
  assert.equal(row.note, "pełnoziarnisty");
});

test("a merge of two dishes keeps the item's amount and note", () => {
  const row = onlyRow(
    [
      spaghetti(ingredient("s1", "Makaron", "500 g")),
      lasagne(ingredient("l1", "Makaron", "400 g")),
    ],
    [listItem("item-1", "Makaron", "1 kg", "pełnoziarnisty")],
  );
  assert.equal(row.op, "merge");
  assert.equal(row.amount, "1 kg + 500 g + 400 g");
  assert.equal(row.note, "pełnoziarnisty; na Spaghetti i Lasagne");
});

test("the same dishes again add their amounts but not their note", () => {
  const row = onlyRow(
    [
      spaghetti(ingredient("s1", "Makaron", "500 g")),
      lasagne(ingredient("l1", "Makaron", "400 g")),
    ],
    [
      listItem(
        "item-1",
        "Makaron",
        "500 g + 400 g",
        "pełnoziarnisty; na Spaghetti i Lasagne",
      ),
    ],
  );
  assert.equal(row.amount, "500 g + 400 g + 500 g + 400 g");
  assert.equal(row.note, "pełnoziarnisty; na Spaghetti i Lasagne");
});

test("a removed list item is not merged into", () => {
  const row = onlyRow(
    [spaghetti(ingredient("s1", "Makaron", "500 g"))],
    [listItem("item-1", "Makaron", "1 kg", null, "removed")],
  );
  assert.equal(row.op, "create");
  assert.equal(row.amount, "500 g");
});

test("amounts too long for an item move whole to the front of the note", () => {
  const titles = ["Zupa", "Gulasz", "Leczo", "Bigos", "Pierogi"];
  const meals = titles.map((title, index) =>
    meal(
      `m${index}`,
      title,
      ingredient(`r${index}`, "Koncentrat", "1 opakowanie"),
    ),
  );
  const row = onlyRow(meals);
  const allAmounts = Array(5).fill("1 opakowanie").join(" + ");
  assert.ok(allAmounts.length > MAX_AMOUNT_CHARS);
  assert.equal(row.amount, null);
  assert.equal(
    row.note,
    `${allAmounts}; na Zupa i Gulasz i Leczo i Bigos i Pierogi`,
  );
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
  const [german] = mealIngredientOperations(meals, [], "de");
  assert.equal(german!.note, "für Penne Carbonara und Beef Wellington");
  const [english] = mealIngredientOperations(meals, [], "en");
  assert.equal(english!.note, "for Penne Carbonara and Beef Wellington");
  assert.equal(noteForMeals(["Carbonara"], "pl"), null);
});
