import assert from "node:assert/strict";
import test from "node:test";

import { AISLES } from "@/lib/marketing/aisles/labels";
import { addUp, formatAmount, type Product } from "@/lib/marketing/lists/build";
import {
  DEFAULT_PLAN,
  DISHES,
  EXTRAS,
  FORGOTTEN,
  PEOPLE,
  christmasList,
  dishPlan,
  familyMessage,
  onTheTable,
  type ChristmasPlan,
  type Dish,
} from "@/lib/marketing/lists/christmas";
import { listToText, plural } from "@/lib/marketing/lists/format";
import { DEFAULT_WEEK, WEEK_DINNERS, WEEK_PEOPLE, weekList } from "@/lib/marketing/lists/week";

const N = " ";
const plan = (changes: Partial<ChristmasPlan> = {}): ChristmasPlan => ({ ...DEFAULT_PLAN, ...changes });
const amountOf = (lines: readonly { id: string; quantity: string }[], id: string) =>
  lines.find((line) => line.id === id)?.quantity ?? null;

test("Polish numerals and amounts", () => {
  assert.equal(plural(1, "osoba", "osoby", "osób"), `1${N}osoba`);
  assert.equal(plural(3, "osoba", "osoby", "osób"), `3${N}osoby`);
  assert.equal(plural(12, "osoba", "osoby", "osób"), `12${N}osób`);
  assert.equal(plural(22, "osoba", "osoby", "osób"), `22${N}osoby`);
  assert.equal(formatAmount(1.5, "kg"), `1,5${N}kg`);
  assert.equal(formatAmount(1200, "g"), `1,2${N}kg`);
  assert.equal(formatAmount(80, "g"), `80${N}g`);
});

test("amounts are rounded once, after adding everything up", () => {
  const products: Record<"flour", Product<"any">> = {
    flour: { name: "Mąka", aisle: "pantry", unit: "kg", step: 1, when: "any" },
  };
  const needs = Array.from({ length: 5 }, () => ({ need: { product: "flour" as const, each: 0.1 }, people: 1 }));
  assert.equal(addUp(products, needs)[0].quantity, `1${N}kg`);
  // 0.1 + 0.2 is not 0.3 in binary, and must not buy another bag.
  const exact = [0.1, 0.2, 0.7].map((each) => ({ need: { product: "flour" as const, each }, people: 1 }));
  assert.equal(addUp(products, exact)[0].quantity, `1${N}kg`);
});

test("we start with the twelve dishes", () => {
  assert.equal(onTheTable(plan()).length, 12);
  assert.equal(new Set(DISHES.map((dish) => dish.id)).size, DISHES.length);
});

test("a Christmas Eve for eight makes sense in a kitchen", () => {
  const lines = christmasList(plan());
  const kilos = (id: string) => Number((amountOf(lines, id) ?? "0").replace(",", ".").replace(/[^\d.]/g, ""));
  assert.equal(amountOf(lines, "carp"), `1,75${N}kg`);
  assert.equal(amountOf(lines, "wafer"), `1${N}opak.`);
  assert.ok(kilos("eggs") >= 18 && kilos("eggs") <= 32, `eggs: ${kilos("eggs")}`);
  assert.ok(kilos("flour") >= 1 && kilos("flour") <= 3, `flour: ${kilos("flour")}`);
  assert.ok(kilos("herring") >= 1 && kilos("herring") <= 1.5, `herring: ${kilos("herring")}`);
  assert.ok(kilos("driedMushrooms") >= 100 && kilos("driedMushrooms") <= 200, `mushrooms: ${kilos("driedMushrooms")}`);
  assert.ok(lines.length < 80);
});

test("more guests never means less food", () => {
  const value = (people: number) =>
    Object.fromEntries(
      christmasList(plan({ people })).map((line) => [
        line.id,
        Number(line.quantity.replace(",", ".").replace(/[^\d.]/g, "")) * (line.quantity.includes("kg") ? 1000 : 1),
      ]),
    );
  let before = value(PEOPLE.min);
  for (let people = PEOPLE.min + 1; people <= PEOPLE.max; people += 1) {
    const now = value(people);
    for (const id of Object.keys(before)) {
      if (id === "walnuts" || id === "driedMushrooms" || id === "driedFruit" || id === "poppy" || id === "wheat" || id === "nuts") continue;
      assert.ok(now[id] >= before[id], `${id}: ${before[id]} for ${people - 1}, ${now[id]} for ${people}`);
    }
    before = now;
  }
});

test("a dish that somebody brings is not on our list", () => {
  const ours = plan({ dishes: Object.fromEntries(DISHES.map((dish) => [dish.id, "skip"])), extras: Object.fromEntries(EXTRAS.map((e) => [e.id, false])), forgotten: Object.fromEntries(FORGOTTEN.map((f) => [f.id, false])) });
  assert.deepEqual(christmasList(ours), []);
  const bring = { ...ours, dishes: { ...ours.dishes, karp: "bring" as const, pierogi: "buy" as const } };
  assert.deepEqual(christmasList(bring).map((line) => line.id), ["readyPierogi"]);
  assert.equal(familyMessage(ours), null);
  const message = familyMessage({ ...bring, people: 3 }) ?? "";
  assert.match(message, /3 osoby/);
  assert.match(message, /Do przyniesienia: karp smażony\./);
  assert.match(message, /U nas będzie: pierogi z kapustą i grzybami\./);
});

test("a plan saved by an older page still opens", () => {
  const old = { people: 6, home: 2, dishes: { nieznane: "make" }, extras: {}, forgotten: {} } as ChristmasPlan;
  assert.ok(christmasList(old).length > 20);
  assert.equal(dishPlan(old, DISHES[0] as Dish), "make");
});

test("every product has a real aisle and a name that fits a line", () => {
  const all = [...christmasList(plan({ dishes: Object.fromEntries(DISHES.map((d) => [d.id, "make"])) })), ...weekList(DEFAULT_WEEK)];
  for (const line of all) {
    assert.ok(AISLES.includes(line.aisle), line.name);
    assert.ok(line.name.length <= 42, line.name);
    assert.doesNotMatch(line.name, /[–—]/);
  }
});

test("a week for one, two and a family", () => {
  const one = weekList({ ...DEFAULT_WEEK, people: 1 });
  const family = weekList({ ...DEFAULT_WEEK, people: 4 });
  assert.equal(amountOf(one, "eggs"), `4${N}szt.`);
  assert.equal(amountOf(family, "eggs"), `16${N}szt.`);
  assert.equal(amountOf(one, "bread"), `0,5${N}kg`);
  assert.equal(amountOf(family, "milk"), `3${N}l`);
  assert.ok(one.some((line) => line.when === "topup"));
});

test("no meat means no meat, no dinners means no dinners", () => {
  const meatless = weekList({ ...DEFAULT_WEEK, meat: false });
  assert.ok(!meatless.some((line) => line.aisle === "meat" || line.aisle === "fish" || line.id === "frozenFish"));
  const out = weekList({ ...DEFAULT_WEEK, dinners: 0 });
  assert.equal(amountOf(out, "pasta"), null);
  for (let people = WEEK_PEOPLE.min; people <= WEEK_PEOPLE.max; people += 1) {
    for (let dinners = WEEK_DINNERS.min; dinners <= WEEK_DINNERS.max; dinners += 1) {
      for (const line of weekList({ ...DEFAULT_WEEK, people, dinners })) {
        assert.doesNotMatch(line.quantity, /NaN|Infinity|undefined/);
      }
    }
  }
});

test("the copied text has headings, dashes and no leftovers of typesetting", () => {
  const text = listToText("Lista", [
    { title: "Nabiał", lines: [{ name: "Jajka", quantity: `10${N}szt.` }] },
    { title: "Ryby", lines: [] },
  ]);
  assert.equal(text, "Lista\n\nNABIAŁ\n- Jajka 10 szt.");
});
