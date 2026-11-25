import assert from "node:assert/strict";
import test from "node:test";

import { buildAisleWords } from "@/lib/marketing/aisles/dictionary";
import {
  buildAisleIndex,
  findAisle,
  groupByAisle,
  sortByAisles,
  splitList,
} from "@/lib/marketing/aisles/sort";

const index = buildAisleIndex(buildAisleWords());
const aisleOf = (name: string) => findAisle(index, name);

/** The chat from film F01, with the aisles Kangur itself gave each product. */
const F01: readonly [string, string][] = [
  ["mleko", "dairy"], ["jajka 10 szt", "dairy"], ["pomidory", "vegetables"], ["papier toaletowy", "household"],
  ["ser żółty", "dairy"], ["chleb", "bakery"], ["masło", "dairy"], ["kurczak 1kg", "meat"], ["płyn do naczyń", "cleaning"],
  ["banany", "fruit"], ["makaron", "pantry"], ["cebula", "vegetables"], ["passata 2x", "sauces"], ["jogurt naturalny", "dairy"],
  ["ziemniaki", "vegetables"], ["czosnek", "vegetables"], ["szynka", "meat"], ["kawa", "drinks"], ["ogórki", "vegetables"],
  ["karma dla pieska", "pets"], ["2 paczki cebulowych chipsów", "snacks"], ["proszek do prania", "cleaning"],
];

test("the F01 list lands in the same aisles as in the app", () => {
  const items = sortByAisles(F01.map(([text]) => text).join(", "), index);
  assert.equal(items.length, F01.length);
  items.forEach((item, i) => assert.equal(item.aisle, F01[i][1], `${F01[i][0]} -> ${item.aisle}`));
  assert.ok(items.every((item) => item.recognised));
});

test("quantities are kept with the product", () => {
  const [eggs, chicken, passata, milk, butter, flour] = sortByAisles(
    "jajka 10 szt\nkurczak 1kg\npassata 2x\n1,5 l mleka\nkostka masła\nmąka x 2",
    index,
  );
  assert.deepEqual([eggs.name, eggs.quantity], ["Jajka", "10 szt."]);
  assert.deepEqual([chicken.name, chicken.quantity], ["Kurczak", "1kg"]);
  assert.deepEqual([passata.name, passata.quantity], ["Passata", "2"]);
  assert.deepEqual([milk.name, milk.quantity, milk.aisle], ["Mleka", "1,5 l", "dairy"]);
  assert.deepEqual([butter.quantity, butter.aisle], ["1 kostka", "dairy"]);
  assert.deepEqual([flour.name, flour.quantity], ["Mąka", "2"]);
});

test("Polish endings do not matter", () => {
  for (const [form, aisle] of [
    ["pomidorów", "vegetables"], ["pomidorki", "vegetables"], ["jajek", "dairy"], ["bułek", "bakery"], ["ogórka", "vegetables"],
    ["mleka", "dairy"], ["masła", "dairy"], ["sera żółtego", "dairy"], ["kawy", "drinks"], ["szynki", "meat"],
    ["cukinii", "vegetables"], ["pieczarek", "vegetables"], ["chleba", "bakery"], ["makaronu", "pantry"], ["jabłek", "fruit"],
    ["cytryn", "fruit"], ["śledzi", "fish"], ["karpia", "fish"], ["maku", "pantry"], ["mąki", "pantry"],
  ] as const) {
    assert.equal(aisleOf(form), aisle, `${form} -> ${aisleOf(form)}`);
  }
});

test("typing without Polish letters works", () => {
  for (const [form, aisle] of [
    ["smietana", "dairy"], ["maslo", "dairy"], ["bulki", "bakery"], ["plyn do naczyn", "cleaning"], ["ogorki", "vegetables"],
    ["jablka", "fruit"], ["kielbasa", "meat"], ["maka", "pantry"],
  ] as const) {
    assert.equal(aisleOf(form), aisle, `${form} -> ${aisleOf(form)}`);
  }
});

test("more words win over fewer", () => {
  assert.equal(aisleOf("ser żółty w plastrach"), "dairy");
  assert.equal(aisleOf("mleko kokosowe"), "pantry");
  assert.equal(aisleOf("sok pomarańczowy"), "drinks");
  assert.equal(aisleOf("masło orzechowe"), "pantry");
  assert.equal(aisleOf("płyn do płukania ust"), "cosmetics");
  assert.equal(aisleOf("bułka tarta"), "bakery");
  assert.equal(aisleOf("papryka mielona"), "spices");
  assert.equal(aisleOf("tuńczyk w puszce"), "fish");
  assert.equal(aisleOf("szampon dla dzieci"), "cosmetics");
});

test("poppy seeds are not flour", () => {
  assert.equal(aisleOf("mak"), "pantry");
  assert.equal(aisleOf("mąka"), "pantry");
  assert.equal(aisleOf("makowiec"), "bakery");
});

test("messy input is split the way people write", () => {
  const parts = (text: string) => splitList(text).map((part) => part.text);
  assert.deepEqual(parts("- mleko\n* chleb\n[ ] masło\n1. jajka\n☐ ser"), ["mleko", "chleb", "masło", "jajka", "ser"]);
  assert.deepEqual(parts("mleko 1,5 l, chleb; masło"), ["mleko 1,5 l", "chleb", "masło"]);
  assert.deepEqual(parts("  ,, 😘 \n"), []);
});

test("small talk around the product is dropped", () => {
  const items = sortByAisles("a jeszcze może jakieś chipsy\naaa i proszek do prania", index);
  assert.deepEqual(items.map((i) => i.name), ["Chipsy", "Proszek do prania"]);
});

test("'i' joins two products only when both are products", () => {
  assert.deepEqual(sortByAisles("chleb i masło", index).map((i) => i.name), ["Chleb", "Masło"]);
  assert.equal(sortByAisles("kapusta z grochem i grzybami", index).length, 1);
});

test("an unknown product is kept, in Inne", () => {
  const [item] = sortByAisles("wihajster do odkurzacza turbo", index);
  assert.equal(item.recognised, false);
  assert.equal(item.aisle, "other");
});

test("groups follow the aisle order, also a changed one", () => {
  const items = sortByAisles("masło, banany, chleb, jogurt", index);
  assert.deepEqual(groupByAisle(items).map((g) => g.aisle), ["fruit", "dairy", "bakery"]);
  assert.deepEqual(groupByAisle(items, ["bakery", "dairy", "fruit"]).map((g) => g.aisle), ["bakery", "dairy", "fruit"]);
  assert.deepEqual(groupByAisle(items)[1].items.map((i) => i.name), ["Masło", "Jogurt"]);
});

test("a list copied as a list keeps its products and loses its headings", () => {
  const copied = "Lista zakupów\n\nNABIAŁ\n- Masło (kostka) 2 szt.\n- Ser żółty, w plastrach 20 dag\n\nWARZYWA\n- Czosnek (główka) 1 szt.\n- Chleb 1,5 kg (krojony i część do zamrażarki)";
  assert.deepEqual(
    sortByAisles(copied, index).map(({ name, quantity }) => [name, quantity]),
    [
      ["Masło (kostka)", "2 szt."],
      ["Ser żółty, w plastrach", "20 dag"],
      ["Czosnek (główka)", "1 szt."],
      ["Chleb", "1,5 kg (krojony i część do zamrażarki)"],
    ],
  );
  // Capitals alone are not a heading, and neither is the last line.
  assert.deepEqual(sortByAisles("MLEKO\nCHLEB", index).map((item) => item.name), ["MLEKO", "CHLEB"]);
  assert.deepEqual(sortByAisles("- mleko\n- chleb\nMASŁO", index).length, 3);
});

test("frozen is frozen, and cubes are not always an amount", () => {
  assert.equal(findAisle(index, "mrożone maliny"), "frozen");
  assert.equal(findAisle(index, "fasolka mrożona"), "frozen");
  assert.deepEqual(
    sortByAisles("kostki rosołowe, kostka masła", index).map(({ name, quantity, aisle }) => [name, quantity, aisle]),
    [["Kostki rosołowe", null, "pantry"], ["Masła", "1 kostka", "dairy"]],
  );
  assert.equal(findAisle(index, "oliwa z oliwek"), "pantry");
});

test("an amount on its own belongs to the product before it", () => {
  const of = (text: string) => sortByAisles(text, index).map(({ name, quantity }) => [name, quantity]);
  assert.deepEqual(of("mleko, 2 l, chleb, 1 szt., jajka, 10 szt"), [["Mleko", "2 l"], ["Chleb", "1 szt."], ["Jajka", "10 szt."]]);
  assert.deepEqual(of("Mąka pszenna, 1,5 kg"), [["Mąka pszenna", "1,5 kg"]]);
  assert.deepEqual(of("bakalie (rodzynki, orzechy), miód"), [["Bakalie (rodzynki, orzechy)", null], ["Miód", null]]);
  // Also on a line of its own. With nothing before it, it is nobody's amount.
  assert.deepEqual(of("mleko\n2 l"), [["Mleko", "2 l"]]);
  assert.deepEqual(of("2, mleko"), [["Mleko", null]]);
});

test("what people paste together with a list", () => {
  const names = (text: string) => sortByAisles(text, index).map((item) => item.name);
  assert.deepEqual(names("✔️ mleko\n☑️ chleb\n○ masło\n1️⃣ ser\n→ jajka"), ["Mleko", "Chleb", "Masło", "Ser", "Jajka"]);
  assert.deepEqual(names("4.jajka\n. ser\nmleko –"), ["Jajka", "Ser", "Mleko"]);
  assert.deepEqual(names("Nabiał\n- mleko\n- ser\nDo sklepu:\n- chleb"), ["Mleko", "Ser", "Chleb"]);
  assert.deepEqual(names("7 up, mleko"), ["7 up", "Mleko"]);
  const long = "!".repeat(20000) + " mleko";
  const started = performance.now();
  sortByAisles([long, ".".repeat(20000), "a".repeat(20000)].join("\n"), index);
  assert.ok(performance.now() - started < 400);
});
