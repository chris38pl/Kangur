import assert from "node:assert/strict";
import test from "node:test";

import { CATALOG_PRODUCTS } from "@shared/product-catalog";

import { buildAisleWords } from "@/lib/marketing/aisles/dictionary";
import {
  buildAisleIndex,
  findAisle,
  groupByAisle,
  sortByAisles,
  splitList,
} from "@/lib/marketing/aisles/sort";
import { AISLE_TOOL } from "@/lib/marketing/content/topics/aisle-tool";

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

test("the page says how many products the catalogue really has", () => {
  const said = JSON.stringify(AISLE_TOOL).match(/\d{3}(?= produkt)/g) ?? [];
  assert.equal(said.length, 2);
  for (const number of said) assert.equal(Number(number), CATALOG_PRODUCTS.length);
});

/** "Mleko 2 l > dairy", one line per product. */
const sorted = (text: string) =>
  sortByAisles(text, index).map(({ name, quantity, aisle }) => `${name}${quantity ? ` ${quantity}` : ""} > ${aisle}`);

test("a smiley or a lone bracket glues nothing", () => {
  const three = ["Mleko > dairy", "Chleb > bakery", "Masło > dairy"];
  assert.deepEqual(sorted("mleko, chleb, masło :)"), three);
  assert.deepEqual(sorted("1) mleko, 2) chleb, 3) masło"), three);
  assert.deepEqual(sorted("1. mleko 2. chleb 3. masło"), three);
  assert.deepEqual(sorted("mleko, chleb, masło ;-) xD <3"), three);
  assert.deepEqual(sorted("kup proszę mleko, chleb i masło, jajka 10 szt ;)"), [...three, "Jajka 10 szt. > dairy"]);
  assert.deepEqual(sorted("mleko, masło (duże), jajka :)"), ["Mleko > dairy", "Masło (duże) > dairy", "Jajka > dairy"]);
  assert.deepEqual(sorted("bakalie (rodzynki, orzechy), mleko (2%"), ["Bakalie (rodzynki, orzechy) > pantry", "Mleko (2% > dairy"]);
});

test("a title on the same line as the products does not take them away", () => {
  assert.equal(sorted("Lista zakupów na tydzień: mleko, chleb, masło").length, 3);
  assert.equal(sorted("lista zakupów na wigilię - karp, śledzie, barszcz").length, 3);
  assert.deepEqual(sorted("Lista zakupów na tydzień, 2 osoby\n\nNABIAŁ\n- Mleko 2 l"), ["Mleko 2 l > dairy"]);
  assert.deepEqual(sorted("Lista zakupów na Wigilię i święta 2026, 8\u00a0osób\n\nRYBY\n- Karp 1,75 kg"), ["Karp 1,75 kg > fish"]);
});

test("the first line stays when the second one is a heading", () => {
  assert.deepEqual(
    sorted("mleko, chleb, masło\nDo drogerii:\n- szampon\n- pasta do zębów").map((line) => line.split(" > ")[0]),
    ["Mleko", "Chleb", "Masło", "Szampon", "Pasta do zębów"],
  );
  assert.equal(sorted("jajka 10 szt\nWARZYWA\n- marchew\n- cebula").length, 3);
  assert.equal(sorted("chleb\nNabiał:\n- mleko\n- ser").length, 3);
  assert.equal(sorted("MLEKO\n- CHLEB\n- MASŁO").length, 3);
});

test("a bulleted line with several known products is split", () => {
  assert.deepEqual(sorted("- chleb, płyn do naczyń\n- masło, karma dla kota"), [
    "Chleb > bakery",
    "Płyn do naczyń > cleaning",
    "Masło > dairy",
    "Karma dla kota > pets",
  ]);
  assert.deepEqual(sorted("- mleko, 2 l, chleb\n- masło"), ["Mleko 2 l > dairy", "Chleb > bakery", "Masło > dairy"]);
  assert.equal(sorted("- ser żółty, w plastrach 20 dag\n- mleko").length, 2);
  assert.deepEqual(sorted("-mleko\n-chleb"), ["Mleko > dairy", "Chleb > bakery"]);
  assert.deepEqual(sorted("NABIAŁ\n1. mleko\n2. ser"), ["Mleko > dairy", "Ser > dairy"]);
});

test("what stands before a colon is not a product", () => {
  assert.deepEqual(sorted("Kochanie weź proszę: mleko, chleb"), ["Mleko > dairy", "Chleb > bakery"]);
  assert.deepEqual(sorted("Nabiał: mleko, ser"), ["Mleko > dairy", "Ser > dairy"]);
  assert.deepEqual(sorted("Na sobotę:\nmleko\nchleb"), ["Mleko > dairy", "Chleb > bakery"]);
  assert.deepEqual(sorted("Zakupy\n- mleko\n- chleb"), ["Mleko > dairy", "Chleb > bakery"]);
  assert.deepEqual(sorted("Lista zakupów na tydzień: mleko, chleb, masło"), ["Mleko > dairy", "Chleb > bakery", "Masło > dairy"]);
});

test("greetings and numbers in front are not products", () => {
  assert.deepEqual(sorted("hej, kup mleko, chleb, dzięki, buziaki :*"), ["Mleko > dairy", "Chleb > bakery"]);
  assert.deepEqual(sorted("1. 2 mozzarella\n2. 1,5 kg pieczarki\n3) pół chleba"), [
    "Mozzarella 2 > dairy",
    "Pieczarki 1,5 kg > vegetables",
    "Chleba pół > bakery",
  ]);
  assert.deepEqual(sorted("1.5 l wody"), ["Wody 1.5 l > drinks"]);
});

test("a unit can be a part of the name", () => {
  assert.deepEqual(sorted("2 kostki rosołowe, kostki rosołowe (warzywne), mleko"), [
    "Kostki rosołowe 2 > spices",
    "Kostki rosołowe (warzywne) > spices",
    "Mleko > dairy",
  ].map((line) => line.replace("spices", aisleOf("kostki rosołowe") ?? "")));
  assert.deepEqual(sorted("aaa i mleko i chleb 0,5 kg"), ["Mleko > dairy", "Chleb 0,5 kg > bakery"]);
  assert.deepEqual(sorted("szynka, 5 plastrów"), ["Szynka 5 plastrów > meat"]);
  assert.deepEqual(sorted("twaróg 20 dag, 2 plastry"), ["Twaróg 20 dag > dairy", "Plastry 2 > pharmacy"]);
  assert.deepEqual(sorted("imbir x2,2 pomidory, woda 6x1,5 l"), ["Imbir 2 > vegetables", "Pomidory 2 > vegetables", "Woda 6x1,5 l > drinks"]);
});

test("dkg, gr and multi-packs are amounts", () => {
  assert.deepEqual(sorted("ser żółty, 20 dkg, szynka, 15 dkg"), ["Ser żółty 20 dkg > dairy", "Szynka 15 dkg > meat"]);
  assert.deepEqual(sorted("200 gr masła"), ["Masła 200 gr > dairy"]);
  assert.deepEqual(sorted("mąka, 500 gr"), ["Mąka 500 gr > pantry"]);
  assert.deepEqual(sorted("woda 6x1,5l, piwo 4 x 0,5 l"), ["Woda 6x1,5l > drinks", "Piwo 4 x 0,5 l > alcohol"]);
  assert.deepEqual(sorted("6x1,5 l wody"), ["Wody 6x1,5 l > drinks"]);
  assert.deepEqual(sorted("2 x mleko, mleko x3"), ["Mleko 2 > dairy", "Mleko 3 > dairy"]);
});

test("iced tea is a drink, frozen peas are frozen", () => {
  assert.equal(aisleOf("herbata mrożona"), "drinks");
  assert.equal(aisleOf("mrożona kawa"), "drinks");
  assert.equal(aisleOf("groszek mrożony"), "frozen");
});

test("messages copied together lose their time and author", () => {
  assert.deepEqual(sorted("[18:02, 25.11.2026] Ola: mleko, chleb\n[18:03, 25.11.2026] Ola: aaa i masło"), [
    "Mleko > dairy",
    "Chleb > bakery",
    "Masło > dairy",
  ]);
  assert.deepEqual(sorted("25.11.2026, 18:02 - Tomek: jajka 10 szt"), ["Jajka 10 szt. > dairy"]);
});

test("a whole page pasted by mistake stops at the limit", () => {
  assert.equal(sortByAisles("a,".repeat(10_000), index, 400).length, 400);
});

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

/** The same lists on every run, the way people write them: smileys, notes, bullets, amounts. */
test("two thousand random messages lose no product and glue none", () => {
  let seed = 20261125;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const pick = <T>(from: readonly T[]): T => from[Math.floor(random() * from.length)];
  const words = CATALOG_PRODUCTS.map((product) => product.labels.pl.toLocaleLowerCase("pl")).filter(
    // "Plastry" are also slices, and a name with a preposition is a dish for the sorter.
    (word) => /^[\p{L} ]+$/u.test(word) && word !== "plastry" && !/ (?:i|z|ze|oraz|do|na|w|dla|bez) /.test(` ${word} `),
  );
  const dress = (word: string) => {
    const before = pick(["", "", "", "", "2 ", "pół kilo ", "1,5 kg "]);
    const after = before ? "" : pick(["", "", "", " 2 szt", " 1 kg", " x2", " 20 dag", " 15 dkg", " 500 gr", " 6x1,5 l", " 10szt."]);
    return before + word + after + pick(["", "", "", "", " (małe)", " (te zielone, duże)"]);
  };
  const styles: readonly ((parts: readonly string[]) => string)[] = [
    (parts) => parts.join(", "),
    (parts) => parts.join("\n"),
    (parts) => parts.join("; "),
    (parts) => parts.join(" • "),
    (parts) => parts.join(" + "),
    (parts) => `${parts.slice(0, -1).join(", ")} i ${parts.at(-1)}`,
    (parts) => parts.map((part) => `- ${part}`).join("\n"),
    (parts) => parts.map((part) => `-${part}`).join("\n"),
    (parts) => parts.map((part, i) => `${i + 1}. ${part}`).join("\n"),
  ];
  const bad: string[] = [];
  for (let run = 0; run < 2000; run += 1) {
    const products: string[] = [];
    while (products.length < 2 + (run % 9)) {
      const word = pick(words);
      if (!products.some((other) => other.includes(word) || word.includes(other))) products.push(word);
    }
    const style = Math.floor(random() * styles.length);
    const start = style >= 6 ? pick(["", "Zakupy:\n", "Na sobotę:\n", "LISTA\n"]) : pick(["", "", "hej, kup ", "Kochanie weź proszę: ", "aaa i ", "[18:02, 25.11.2026] Ola: "]);
    const text = start + styles[style](products.map(dress)) + pick(["", " :)", " ;-)", " ❤️", "!", " xD", " :*", "..."]);
    const names = sortByAisles(text, index).map((item) => item.name.toLocaleLowerCase("pl"));
    const lost = products.filter((word) => !names.some((name) => name === word || name.startsWith(`${word} (`)));
    if (lost.length > 0 || names.length !== products.length) bad.push(`${JSON.stringify(text)} => ${names.join(" | ")}`);
  }
  assert.deepEqual(bad, []);
});
