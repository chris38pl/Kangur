import assert from "node:assert/strict";
import test from "node:test";

import { matchCatalogProduct, resolveCatalogLabel } from "@shared/product-catalog";

import {
  DEFAULT_PLAN,
  DISHES,
  EXTRAS,
  FORGOTTEN,
  PRESETS,
  applyPreset,
  christmasList,
  christmasTrips,
  dishPlan,
  planChanges,
  readPlan,
  type ChristmasPlan,
  type Dish,
  type DishPlan,
} from "@/lib/marketing/lists/christmas";
import { packList, packTicks, unpackList, unpackTicks } from "@/lib/marketing/lists/handoff";
import { KANGUR_LIMIT, kangurPart, kangurParts, type KangurPart } from "@/lib/marketing/lists/parts";
import { DEFAULT_WEEK, readWeek, weekChanges, weekList, weekTrips, type WeekPlan } from "@/lib/marketing/lists/week";

/** The same plans on every run. */
function randomPlans(count: number): ChristmasPlan[] {
  let seed = 24122026;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const coin = () => random() < 0.5;
  return Array.from({ length: count }, (): ChristmasPlan => ({
    people: 1 + Math.floor(random() * 30),
    home: 1 + Math.floor(random() * 12),
    meat: coin(),
    seat: coin(),
    dishes: Object.fromEntries(
      (DISHES as readonly Dish[]).map((dish): [string, DishPlan] => [
        dish.id,
        (["make", dish.ready ? "buy" : "make", "bring", "skip"] as const)[Math.floor(random() * 4)],
      ]),
    ),
    extras: Object.fromEntries(EXTRAS.map(({ id }) => [id, coin()])),
    forgotten: Object.fromEntries(FORGOTTEN.map(({ id }) => [id, coin()])),
    own: coin() ? [{ name: "Moczka śląska", plan: coin() ? "bring" : "make" }] : [],
  }));
}

const productLines = (part: KangurPart) => part.text.split("\n").slice(1);

const called = new Map<string, string>();

/** What Kangur is likely to call the product: no packaging, no size, its own catalogue name. */
function inKangur(line: string): string {
  const before = called.get(line);
  if (before !== undefined) return before;
  const name = line
    .replace(/^- /, "")
    .replace(/ \([^)]*\)/g, "")
    .replace(/(?: [\d,]+ (?:kg|g|l|szt\.|opak\.))+$/u, "");
  const known = matchCatalogProduct(name, "pl");
  const label = (known ? resolveCatalogLabel(known, "pl") : name).toLocaleLowerCase("pl");
  called.set(line, label);
  return label;
}

/** Kangur keeps the first product of a name and drops the next ones, with their amounts. */
function assertNothingDropped(part: KangurPart) {
  const names = productLines(part).map(inKangur);
  const twice = names.filter((name, i) => names.indexOf(name) !== i);
  assert.deepEqual(twice, [], `${part.label}: ${twice.join(", ")}`);
}

function assertFitsKangur(part: KangurPart) {
  const [title, ...lines] = part.text.split("\n");
  assert.ok(title.length <= 32, title);
  assert.doesNotMatch(title, /^-/);
  assert.equal(lines.length, part.count);
  for (const line of lines) assert.match(line, /^- \S/);
  assert.ok(part.text.length <= KANGUR_LIMIT);
  // Ordinary spaces: typesetting stays on the page.
  assert.doesNotMatch(part.text, /[  ⁠]/);
}

test("a list survives the way from a computer to a phone", () => {
  const list = { p: { people: 6, own: [{ name: "Makówki, zażółcone", plan: "bring" }] }, d: [0, 7, 31] };
  const hash = packList(list);
  assert.match(hash, /^#k=[\w-]+$/);
  assert.deepEqual(unpackList(hash), list);
  assert.equal(packList({}), "#k=e30");
  assert.deepEqual(unpackList("#k=e30"), {});
});

test("anything else in the address is not a list", () => {
  const junk = ["", "#", "#do-kangura", "#k=", "#k=%%%", "#k=bnVsbA", "#k=WzFd", "#k=ImEi", "#k=e30x", `#k=${"a".repeat(7000)}`];
  for (const hash of junk) assert.equal(unpackList(hash), null, hash.slice(0, 20));
});

test("ticks travel as places on the list", () => {
  const ids = ["a", "b", "c", "d"];
  assert.deepEqual(packTicks(ids, new Set(["b", "d", "somebody else's"])), [1, 3]);
  assert.deepEqual(unpackTicks([1, 3], ids), ["b", "d"]);
  for (const junk of [null, "1,3", [9, -1, "0", null, {}], {}]) assert.deepEqual(unpackTicks(junk, ids), []);
});

test("a Christmas plan is sent as what changed, and nothing is lost", () => {
  assert.deepEqual(planChanges(DEFAULT_PLAN), {});
  for (const { id } of PRESETS) {
    const plan = applyPreset(DEFAULT_PLAN, id);
    assert.deepEqual(christmasList(readPlan(planChanges(plan))), christmasList(plan), id);
  }
  for (const plan of randomPlans(200)) {
    const there = readPlan(JSON.parse(JSON.stringify(planChanges(plan))));
    assert.deepEqual(christmasList(there), christmasList(plan));
    assert.deepEqual(there.own, plan.own);
    assert.deepEqual(
      (DISHES as readonly Dish[]).map((dish) => dishPlan(there, dish)),
      (DISHES as readonly Dish[]).map((dish) => dishPlan(plan, dish)),
    );
  }
});

test("a week is sent as what changed, and nothing is lost", () => {
  assert.deepEqual(weekChanges(DEFAULT_WEEK), {});
  for (const people of [1, 2, 8]) {
    for (const dinners of [0, 5, 7]) {
      for (const [meat, cupboard] of [[true, true], [true, false], [false, true], [false, false]]) {
        const week: WeekPlan = { people, dinners, meat, cupboard };
        assert.deepEqual(readWeek(JSON.parse(JSON.stringify(weekChanges(week)))), week);
      }
    }
  }
});

test("every Christmas trip is a list that Kangur takes in whole", () => {
  const plans = [DEFAULT_PLAN, ...PRESETS.map(({ id }) => applyPreset(DEFAULT_PLAN, id)), ...randomPlans(200)];
  for (const plan of plans) {
    const lines = christmasList(plan);
    const { whole, trips } = christmasTrips(plan, lines);
    assert.equal(trips.reduce((sum, part) => sum + part.count, 0), lines.length);
    assert.equal(whole.count, lines.length);
    for (const part of [whole, ...trips]) {
      assertFitsKangur(part);
      assertNothingDropped(part);
    }
  }
});

test("a week is two lists, because milk is on both", () => {
  for (const people of [1, 2, 4, 8]) {
    for (const [meat, cupboard] of [[true, true], [false, true], [true, false]]) {
      const lines = weekList({ ...DEFAULT_WEEK, people, meat, cupboard });
      const trips = weekTrips(lines);
      assert.deepEqual(trips.map((part) => part.key), ["main", "topup"]);
      assert.equal(trips.reduce((sum, part) => sum + part.count, 0), lines.length);
      for (const part of trips) {
        assertFitsKangur(part);
        assertNothingDropped(part);
      }
    }
  }
  // All that is left to buy may be in one of them.
  const fresh = weekList(DEFAULT_WEEK).filter((line) => line.when === "topup");
  assert.deepEqual(weekTrips(fresh).map((part) => part.label), ["Dokupka"]);
});

test("text for Kangur has a name and products, nothing else", () => {
  const part = kangurPart("x", "Dokupka", "Małe zakupy w tygodniu", [
    { name: "Mleko", quantity: "2 l" },
    { name: "Chleb", quantity: "1 kg", note: "krojony" },
  ]);
  assert.equal(part.text, "Małe zakupy w tygodniu\n- Mleko 2 l\n- Chleb 1 kg (krojony)");
  assert.equal(part.count, 2);
});

test("a very long list is taken in several goes", () => {
  const lines = Array.from({ length: 400 }, (_, i) => ({ name: `Produkt z długą nazwą numer ${i}`, quantity: "2 opak." }));
  const parts = kangurParts("Lista zakupów", lines);
  assert.ok(parts.length > 1);
  assert.equal(parts.reduce((sum, part) => sum + part.count, 0), 400);
  for (const part of parts) assert.ok(part.text.length <= KANGUR_LIMIT, String(part.text.length));
  assert.deepEqual(parts.flatMap(productLines).length, 400);
  assert.equal(new Set(parts.map((part) => part.key)).size, parts.length);

  const [short] = kangurParts("Lista zakupów", lines.slice(0, 3));
  assert.equal(short.text.split("\n")[0], "Lista zakupów");
  assert.deepEqual(kangurParts("Lista zakupów", []), []);
});
