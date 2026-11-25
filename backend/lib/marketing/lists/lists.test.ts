import assert from "node:assert/strict";
import test from "node:test";

import { AISLES } from "@/lib/marketing/aisles/labels";
import { addUp, formatAmount, type Product } from "@/lib/marketing/lists/build";
import { buildAisleWords } from "@/lib/marketing/aisles/dictionary";
import { AISLE_LABELS } from "@/lib/marketing/aisles/labels";
import { buildAisleIndex, sortByAisles } from "@/lib/marketing/aisles/sort";
import {
  DEFAULT_PLAN,
  DISHES,
  EXTRAS,
  FORGOTTEN,
  PEOPLE,
  PRESETS,
  PRODUCTS,
  activePreset,
  applyPreset,
  christmasList,
  christmasTitle,
  dishCount,
  dishPlan,
  familyMessage,
  menu,
  onTheTable,
  readPlan,
  type ChristmasPlan,
  type Dish,
} from "@/lib/marketing/lists/christmas";
import { dishTable, kitchenWeight } from "@/lib/marketing/lists/dish-table";
import { listToText, plural } from "@/lib/marketing/lists/format";
import { DEFAULT_WEEK, WEEK_DINNERS, WEEK_PEOPLE, readWeek, weekList } from "@/lib/marketing/lists/week";

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
  assert.equal(amountOf(lines, "eggs"), `20${N}szt.`);
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
  const ours = plan({ dishes: Object.fromEntries(DISHES.map((dish) => [dish.id, "skip" as const])), extras: Object.fromEntries(EXTRAS.map((e) => [e.id, false])), forgotten: Object.fromEntries(FORGOTTEN.map((f) => [f.id, false])) });
  assert.deepEqual(christmasList(ours), []);
  const bring = { ...ours, dishes: { ...ours.dishes, karp: "bring" as const, pierogi: "buy" as const } };
  assert.deepEqual(christmasList(bring).map((line) => line.id), ["readyPierogi"]);
  assert.equal(familyMessage(ours), null);
  const message = familyMessage({ ...bring, people: 3 }) ?? "";
  assert.match(message, /3 osoby/);
  assert.match(message, /Do przyniesienia: karp smażony\./);
  assert.match(message, /U nas będzie: pierogi z kapustą i grzybami\./);
  assert.match(message, /getkangur\.com\/wigilia$/);
});

test("a plan saved by an older page still opens", () => {
  const old = readPlan({ people: 6, home: 2, dishes: { nieznane: "make", karp: "bring" }, extras: {}, forgotten: {} });
  assert.ok(christmasList(old).length > 20);
  assert.equal(old.people, 6);
  assert.equal(dishPlan(old, DISHES[0] as Dish), "make");
  assert.deepEqual(old.dishes, { karp: "bring" });
  assert.deepEqual(readWeek({ people: 3 }), { ...DEFAULT_WEEK, people: 3 });
});

test("every product has a real aisle and a name that fits a line", () => {
  const all = [...christmasList(plan({ dishes: Object.fromEntries(DISHES.map((d) => [d.id, "make"])) })), ...weekList(DEFAULT_WEEK)];
  for (const line of all) {
    assert.ok(AISLES.includes(line.aisle), line.name);
    assert.ok(line.name.length <= 42, line.name);
    // A copied list is split at commas, by people and by AI.
    assert.doesNotMatch(line.name, /[–—,]/);
    assert.doesNotMatch(line.note ?? "", /[–—]/);
  }
});

test("a week for one, two and a family", () => {
  const one = weekList({ ...DEFAULT_WEEK, people: 1 });
  const family = weekList({ ...DEFAULT_WEEK, people: 4 });
  // Eggs come in sixes and tens.
  assert.equal(amountOf(one, "eggs"), `6${N}szt.`);
  // A ten and a six, because sixteen eggs do not need two tens.
  assert.equal(amountOf(family, "eggs"), `16${N}szt.`);
  // One person keeps dry things in the cupboard, unless the cupboard is hidden.
  assert.equal(one.find((line) => line.id === "rice")?.when, "cupboard");
  assert.equal(weekList({ ...DEFAULT_WEEK, people: 1, cupboard: false }).find((line) => line.id === "rice")?.when, "main");
  assert.equal(family.find((line) => line.id === "rice")?.when, "main");
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

test("anything left in the browser opens", () => {
  const junk: unknown[] = [
    null, [], "tekst", 7, true, {},
    { people: "dużo", home: -3, dishes: [], extras: 4, forgotten: null, own: {} },
    { people: NaN, dishes: { karp: "zjeść" }, own: [1, { name: "  " }, { name: "Moczka", plan: "x" }] },
  ];
  for (const stored of junk) {
    const christmas = readPlan(stored);
    assert.ok(christmas.people >= PEOPLE.min && christmas.people <= PEOPLE.max, JSON.stringify(stored));
    for (const line of christmasList(christmas)) assert.doesNotMatch(line.quantity, /NaN|undefined|Infinity/);
    assert.ok(weekList(readWeek(stored)).length > 20);
  }
  assert.deepEqual(readPlan(junk.at(-1)).own, [{ name: "Moczka", plan: "make" }]);
  assert.equal(readPlan({ people: 400 }).people, PEOPLE.max);
});

test("presets put the right dishes on the table and know themselves", () => {
  assert.equal(activePreset(DEFAULT_PLAN), "twelve");
  for (const { id } of PRESETS) {
    const chosen = applyPreset(plan(), id);
    assert.equal(activePreset(chosen), id);
    assert.ok(christmasList(chosen).length > 15, id);
  }
  assert.equal(dishCount(applyPreset(plan(), "six")), 6);
  const noFish = applyPreset(plan(), "no-fish");
  assert.equal(dishCount(noFish), 12);
  assert.ok(!christmasList(noFish).some((line) => line.aisle === "fish"));
  // What somebody already promised to bring stays promised.
  assert.equal(applyPreset(plan({ dishes: { pierogi: "bring" } }), "six").dishes.pierogi, "bring");
});

test("no Christmas Eve means no wafer, no carp and something to eat on all four days", () => {
  const lines = christmasList(applyPreset(plan(), "no-eve"));
  for (const id of ["wafer", "hay", "candles", "carp", "herring"]) assert.equal(amountOf(lines, id), null, id);
  for (const id of ["pasta", "roast", "soupMeat", "buckwheat", "eggs", "bread"]) assert.ok(amountOf(lines, id), id);
  assert.match(christmasTitle(applyPreset(plan(), "no-eve")), /cztery dni bez sklepu, 4/);
});

test("no meat means no meat at Christmas either", () => {
  const lines = christmasList(applyPreset(plan({ meat: false }), "no-fish"));
  assert.ok(!lines.some((line) => line.aisle === "meat" || line.aisle === "fish"));
  assert.ok(amountOf(lines, "hummus"));
});

test("the extra plate feeds one more", () => {
  const carp = (seat: boolean, people: number) => amountOf(christmasList(plan({ seat, people })), "carp");
  assert.equal(carp(true, 8), carp(false, 9));
});

test("a dish from outside the list counts and travels in the message", () => {
  const own = plan({ own: [{ name: "Moczka", plan: "make" }, { name: "Makówki", plan: "bring" }] });
  assert.equal(dishCount(own), 14);
  assert.deepEqual(menu(own).bring, ["makówki"]);
  assert.match(familyMessage(own) ?? "", /moczka.*Do przyniesienia: makówki\./);
});

test("what rots is not bought too early", () => {
  for (const id of ["carp", "whiteFish", "roast", "coldCuts", "milk"] as const) assert.equal(PRODUCTS[id].when, "last", id);
  assert.match(PRODUCTS.soupMeat.note ?? "", /zamrażarki/);
});

test("products dish by dish, in kitchen words", () => {
  assert.equal(kitchenWeight(1.6), "1,6 kg");
  assert.equal(kitchenWeight(0.28), "30 dag");
  assert.equal(kitchenWeight(0.12), "12 dag");
  assert.equal(kitchenWeight(0.064), "65 g");
  const rows = dishTable().map(({ dish, products }) => ({
    dish: dish.replace(/\s/gu, " "),
    products: products.replace(/\s/gu, " "),
  }));
  assert.equal(rows.length, 12);
  const of = (name: string) => rows.find((row) => row.dish === name)?.products ?? "";
  assert.match(of("Karp smażony"), /^karp 1,6 kg, mąka pszenna 12 dag, masło klarowane 16 dag, 2 cytryny$/);
  assert.match(of("Kutia"), /pół słoika miodu/);
  assert.equal(rows.filter((row) => /cebula/.test(row.products)).length, 6);
  for (const { products } of rows) assert.doesNotMatch(products, /NaN|undefined|\(|–/);
});

test("a list copied from our calculators survives our own aisle tool", () => {
  const index = buildAisleIndex(buildAisleWords());
  const check = (
    title: string,
    lines: readonly { name: string; quantity: string; note?: string }[],
    titles: readonly string[],
  ) => {
    const groups = titles.map((heading, i) => ({
      title: heading,
      lines: lines.filter((_, n) => n % titles.length === i),
    }));
    const items = sortByAisles(listToText(title, groups), index);
    assert.equal(items.length, lines.length, items.map((item) => item.name).join(" | "));
    const unknown = items.filter((item) => !item.recognised).map((item) => item.name);
    assert.ok(unknown.length <= 4, unknown.join(" | "));
  };
  check(christmasTitle(plan()), christmasList(plan()), ["Do 13 grudnia", "19 i 20 grudnia", "22 i 23 grudnia"]);
  check(christmasTitle(plan()), christmasList(plan()), [AISLE_LABELS.fruit, AISLE_LABELS.dairy, AISLE_LABELS.household]);
  check("Lista zakupów na tydzień, 4 osoby", weekList({ ...DEFAULT_WEEK, people: 4 }), ["Duże zakupy", "Dokupka", "Najpierw sprawdź szafkę"]);
});
