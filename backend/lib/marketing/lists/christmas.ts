import type { Aisle } from "@/lib/marketing/aisles/labels";
import { addUp, type Line, type Need, type Product } from "@/lib/marketing/lists/build";
import { plural } from "@/lib/marketing/lists/format";

/**
 * Shopping for a Polish Christmas Eve and the days after it.
 *
 * Twelve dishes are twelve tastings, not twelve dinners: the amounts below are small
 * portions of home recipes, so that people get up from the table and the fridge closes.
 * When to buy: shops are shut 24-27 December 2026, the last trading Sunday is the 20th.
 */
export type When = "early" | "weekend" | "last";

type P = Product<When>;
const p = (name: string, aisle: Aisle, unit: P["unit"], step: number, when: When, note?: string): P => ({
  name,
  aisle,
  unit,
  step,
  when,
  ...(note ? { note } : {}),
});

export const PRODUCTS = {
  // Vegetables and fruit
  beetroot: p("Buraki", "vegetables", "kg", 0.5, "weekend"),
  carrot: p("Marchew", "vegetables", "kg", 0.5, "weekend"),
  parsley: p("Pietruszka, korzeń", "vegetables", "kg", 0.25, "weekend"),
  celeriac: p("Seler, korzeń", "vegetables", "szt.", 1, "weekend"),
  soupGreens: p("Włoszczyzna, pęczek", "vegetables", "szt.", 1, "weekend"),
  onion: p("Cebula", "vegetables", "kg", 0.5, "weekend"),
  garlic: p("Czosnek, główka", "vegetables", "szt.", 1, "weekend"),
  potato: p("Ziemniaki", "vegetables", "kg", 0.5, "weekend"),
  sauerkraut: p("Kapusta kiszona", "vegetables", "kg", 0.5, "weekend"),
  cabbage: p("Kapusta biała, główka", "vegetables", "szt.", 1, "weekend"),
  pickles: p("Ogórki kiszone", "vegetables", "kg", 0.25, "weekend"),
  beetKvass: p("Zakwas buraczany", "vegetables", "l", 0.5, "weekend"),
  tomato: p("Pomidory", "vegetables", "kg", 0.5, "last"),
  apple: p("Jabłka kwaśne", "fruit", "kg", 0.5, "weekend"),
  lemon: p("Cytryny", "fruit", "szt.", 1, "weekend"),
  mandarin: p("Mandarynki", "fruit", "kg", 0.5, "weekend"),

  // Fish and meat
  carp: p("Karp, dzwonka albo filety", "fish", "kg", 0.25, "last"),
  herring: p("Śledzie, płaty", "fish", "kg", 0.25, "weekend"),
  whiteFish: p("Biała ryba, filety", "fish", "kg", 0.25, "weekend", "może być mrożona"),
  roast: p("Mięso na pieczeń", "meat", "kg", 0.25, "weekend"),
  soupMeat: p("Porcja rosołowa", "meat", "kg", 0.25, "weekend"),
  coldCuts: p("Wędlina", "meat", "kg", 0.1, "last"),

  // Dairy
  eggs: p("Jajka", "dairy", "szt.", 1, "weekend"),
  butter: p("Masło, kostka", "dairy", "szt.", 1, "weekend"),
  ghee: p("Masło klarowane, 250 g", "dairy", "szt.", 1, "weekend"),
  sourCream: p("Śmietana 18%, kubek 400 g", "dairy", "szt.", 1, "last"),
  curd: p("Twaróg na sernik", "dairy", "kg", 0.5, "weekend"),
  cheese: p("Ser żółty", "dairy", "kg", 0.1, "last"),
  milk: p("Mleko", "dairy", "l", 1, "last"),

  // Bakery
  bread: p("Chleb", "bakery", "kg", 0.5, "last", "pokrojony przetrwa w zamrażarce"),
  wafer: p("Opłatek", "bakery", "opak.", 1, "early"),
  breadcrumbs: p("Bułka tarta", "bakery", "opak.", 1, "early"),

  // Pantry
  flour: p("Mąka pszenna", "pantry", "kg", 1, "early"),
  sugar: p("Cukier", "pantry", "kg", 1, "early"),
  icingSugar: p("Cukier puder", "pantry", "opak.", 1, "early"),
  driedMushrooms: p("Suszone grzyby", "pantry", "g", 20, "early"),
  splitPeas: p("Groch łuskany", "pantry", "kg", 0.5, "early"),
  beans: p("Fasola Jaś", "pantry", "kg", 0.5, "early"),
  driedFruit: p("Susz owocowy na kompot", "pantry", "g", 100, "early"),
  prunes: p("Suszone śliwki", "pantry", "g", 100, "early"),
  wheat: p("Pszenica na kutię", "pantry", "g", 100, "early"),
  poppy: p("Mak", "pantry", "g", 100, "early"),
  poppyPaste: p("Masa makowa, puszka 850 g", "pantry", "szt.", 1, "early"),
  nuts: p("Bakalie: rodzynki, orzechy, migdały", "pantry", "g", 100, "early"),
  honey: p("Miód, słoik", "pantry", "szt.", 1, "early"),
  buckwheat: p("Kasza gryczana", "pantry", "kg", 0.5, "early"),
  noodles: p("Makaron łazanki, 400 g", "pantry", "opak.", 1, "early"),
  soupNoodles: p("Makaron nitki, 250 g", "pantry", "opak.", 1, "early"),
  yeast: p("Drożdże, kostka 100 g", "pantry", "szt.", 1, "weekend"),
  peas: p("Groszek konserwowy, puszka", "pantry", "szt.", 1, "early"),
  tomatoPaste: p("Koncentrat pomidorowy, słoiczek", "pantry", "szt.", 1, "early"),
  puffPastry: p("Ciasto francuskie", "frozen", "opak.", 1, "weekend"),
  oil: p("Olej", "other", "l", 1, "early"),

  // Spices and sauces
  bayLeaf: p("Liść laurowy", "spices", "opak.", 1, "early"),
  allspice: p("Ziele angielskie", "spices", "opak.", 1, "early"),
  marjoram: p("Majeranek", "spices", "opak.", 1, "early"),
  cloves: p("Goździki", "spices", "opak.", 1, "early"),
  cinnamon: p("Cynamon w laskach", "spices", "opak.", 1, "early"),
  gingerbreadSpice: p("Przyprawa do piernika", "spices", "opak.", 1, "early"),
  mayo: p("Majonez, słoik 400 g", "sauces", "szt.", 1, "early"),
  horseradish: p("Chrzan, słoik", "sauces", "szt.", 1, "early"),

  // Ready to eat
  readyUszka: p("Uszka z grzybami, 300 g", "frozen", "opak.", 1, "weekend"),
  readyPierogi: p("Pierogi z kapustą i grzybami", "frozen", "kg", 0.5, "weekend"),
  readyHerringOil: p("Śledzie w oleju, gotowe", "fish", "opak.", 1, "weekend"),
  readyHerringCream: p("Śledzie w śmietanie, gotowe", "fish", "opak.", 1, "last"),
  readyGreekFish: p("Ryba po grecku, gotowa", "fish", "kg", 0.5, "last"),
  readySalad: p("Sałatka jarzynowa, gotowa", "other", "kg", 0.5, "last"),
  readyKutia: p("Kutia, gotowa", "other", "kg", 0.5, "last"),
  readyPoppyCake: p("Makowiec", "bakery", "szt.", 1, "last"),
  readyCheesecake: p("Sernik", "bakery", "kg", 0.5, "last"),
  readyGingerbread: p("Pierniczki", "snacks", "opak.", 1, "early"),
  readyPasties: p("Paszteciki", "bakery", "szt.", 2, "last"),

  // Table and drinks
  water: p("Woda", "drinks", "l", 1.5, "weekend"),
  juice: p("Sok", "drinks", "l", 1, "weekend"),
  coffee: p("Kawa", "drinks", "opak.", 1, "early"),
  tea: p("Herbata", "drinks", "opak.", 1, "early"),
  walnuts: p("Orzechy w łupinach", "snacks", "g", 100, "early"),
  hay: p("Sianko", "household", "szt.", 1, "early"),
  candles: p("Świece", "household", "opak.", 1, "early"),
  napkins: p("Serwetki", "household", "opak.", 1, "early"),

  // What people forget
  boxes: p("Pojemniki na resztki", "household", "opak.", 1, "early"),
  matches: p("Zapałki", "household", "opak.", 1, "early"),
  bakingPaper: p("Papier do pieczenia", "household", "opak.", 1, "early"),
  foil: p("Folia aluminiowa", "household", "opak.", 1, "early"),
  wrappingPaper: p("Papier do pakowania prezentów", "household", "szt.", 2, "early"),
  tape: p("Taśma klejąca", "office", "szt.", 1, "early"),
  batteries: p("Baterie AA i AAA", "electronics", "opak.", 1, "early"),
  binBags: p("Worki na śmieci", "household", "opak.", 1, "early"),
  dishwasher: p("Tabletki do zmywarki", "cleaning", "opak.", 1, "early"),
  toiletPaper: p("Papier toaletowy", "household", "opak.", 1, "early"),
  petFood: p("Karma dla zwierzaka", "pets", "opak.", 1, "weekend"),
  medicine: p("Leki, które się kończą", "pharmacy", "opak.", 1, "weekend"),
} as const satisfies Record<string, P>;

export type ProductId = keyof typeof PRODUCTS;
type N = Need<ProductId>;

export type Dish = {
  id: string;
  name: string;
  kind: "zupa" | "ryba" | "danie" | "deser" | "napój";
  needs: readonly N[];
  /** What to put in the basket when nobody feels like cooking it. */
  ready?: N;
  /** One of the twelve we start with. */
  starter?: boolean;
};

export const DISHES = [
  {
    id: "barszcz", name: "Barszcz czerwony", kind: "zupa", starter: true,
    needs: [
      { product: "beetroot", each: 0.18 }, { product: "beetKvass", each: 0.1 }, { product: "soupGreens", each: 0.15 },
      { product: "driedMushrooms", each: 4 }, { product: "garlic", each: 0.1 },
      { product: "bayLeaf", base: 0.3 }, { product: "allspice", base: 0.3 }, { product: "marjoram", base: 0.3 },
    ],
  },
  {
    id: "uszka", name: "Uszka z grzybami", kind: "danie", starter: true,
    needs: [
      { product: "flour", each: 0.035 }, { product: "driedMushrooms", each: 8 }, { product: "onion", each: 0.03 }, { product: "eggs", each: 0.12 },
    ],
    ready: { product: "readyUszka", each: 0.3 },
  },
  {
    id: "karp", name: "Karp smażony", kind: "ryba", starter: true,
    needs: [
      { product: "carp", each: 0.2 }, { product: "flour", each: 0.015 }, { product: "ghee", each: 0.08 }, { product: "lemon", each: 0.2 },
    ],
  },
  {
    id: "sledz-olej", name: "Śledź w oleju", kind: "ryba", starter: true,
    needs: [
      { product: "herring", each: 0.07 }, { product: "onion", each: 0.04 }, { product: "oil", each: 0.03 },
      { product: "allspice", base: 0.2 }, { product: "bayLeaf", base: 0.2 },
    ],
    ready: { product: "readyHerringOil", each: 0.2 },
  },
  {
    id: "sledz-smietana", name: "Śledź w śmietanie", kind: "ryba", starter: true,
    needs: [
      { product: "herring", each: 0.07 }, { product: "sourCream", each: 0.1 }, { product: "apple", each: 0.04 }, { product: "onion", each: 0.02 },
    ],
    ready: { product: "readyHerringCream", each: 0.2 },
  },
  {
    id: "pierogi", name: "Pierogi z kapustą i grzybami", kind: "danie", starter: true,
    needs: [
      { product: "flour", each: 0.08 }, { product: "sauerkraut", each: 0.1 }, { product: "driedMushrooms", each: 6 },
      { product: "onion", each: 0.04 }, { product: "eggs", each: 0.1 }, { product: "oil", each: 0.01 },
    ],
    ready: { product: "readyPierogi", each: 0.15 },
  },
  {
    id: "kapusta", name: "Kapusta z grochem", kind: "danie", starter: true,
    needs: [
      { product: "sauerkraut", each: 0.12 }, { product: "splitPeas", each: 0.04 }, { product: "onion", each: 0.03 },
      { product: "bayLeaf", base: 0.2 }, { product: "allspice", base: 0.2 },
    ],
  },
  {
    id: "ryba-po-grecku", name: "Ryba po grecku", kind: "ryba", starter: true,
    needs: [
      { product: "whiteFish", each: 0.12 }, { product: "carrot", each: 0.08 }, { product: "parsley", each: 0.025 },
      { product: "celeriac", each: 0.05 }, { product: "onion", each: 0.03 }, { product: "tomatoPaste", each: 0.12 },
      { product: "flour", each: 0.01 }, { product: "oil", each: 0.02 },
    ],
    ready: { product: "readyGreekFish", each: 0.15 },
  },
  {
    id: "salatka", name: "Sałatka jarzynowa", kind: "danie", starter: true,
    needs: [
      { product: "potato", each: 0.08 }, { product: "carrot", each: 0.05 }, { product: "parsley", each: 0.015 }, { product: "eggs", each: 0.5 },
      { product: "peas", each: 0.15 }, { product: "pickles", each: 0.05 }, { product: "apple", each: 0.04 }, { product: "mayo", each: 0.1 },
    ],
    ready: { product: "readySalad", each: 0.15 },
  },
  {
    id: "kompot", name: "Kompot z suszu", kind: "napój", starter: true,
    needs: [
      { product: "driedFruit", each: 45 }, { product: "sugar", each: 0.015 }, { product: "cloves", base: 0.3 }, { product: "cinnamon", base: 0.5 },
    ],
  },
  {
    id: "kutia", name: "Kutia", kind: "deser", starter: true,
    needs: [
      { product: "wheat", each: 30 }, { product: "poppy", each: 30 }, { product: "honey", each: 0.06 }, { product: "nuts", each: 30 },
    ],
    ready: { product: "readyKutia", each: 0.1 },
  },
  {
    id: "makowiec", name: "Makowiec", kind: "deser", starter: true,
    needs: [
      { product: "poppyPaste", each: 0.12 }, { product: "flour", each: 0.04 }, { product: "yeast", each: 0.06 }, { product: "butter", each: 0.05 },
      { product: "milk", each: 0.02 }, { product: "eggs", each: 0.25 }, { product: "sugar", each: 0.01 }, { product: "icingSugar", base: 0.4 },
    ],
    ready: { product: "readyPoppyCake", each: 0.12 },
  },
  {
    id: "grzybowa", name: "Zupa grzybowa", kind: "zupa",
    needs: [
      { product: "driedMushrooms", each: 12 }, { product: "soupGreens", each: 0.15 }, { product: "sourCream", each: 0.08 },
      { product: "noodles", each: 0.1 }, { product: "onion", each: 0.03 },
    ],
  },
  {
    id: "golabki", name: "Gołąbki z kaszą i grzybami", kind: "danie",
    needs: [
      { product: "cabbage", each: 0.12 }, { product: "buckwheat", each: 0.05 }, { product: "driedMushrooms", each: 6 }, { product: "onion", each: 0.04 },
    ],
  },
  {
    id: "fasola", name: "Fasola ze śliwkami", kind: "danie",
    needs: [{ product: "beans", each: 0.05 }, { product: "prunes", each: 30 }, { product: "butter", each: 0.04 }],
  },
  {
    id: "paszteciki", name: "Paszteciki do barszczu", kind: "danie",
    needs: [
      { product: "puffPastry", each: 0.2 }, { product: "sauerkraut", each: 0.06 }, { product: "driedMushrooms", each: 4 },
      { product: "onion", each: 0.02 }, { product: "eggs", each: 0.1 },
    ],
    ready: { product: "readyPasties", each: 2 },
  },
  {
    id: "kluski", name: "Kluski z makiem", kind: "deser",
    needs: [
      { product: "noodles", each: 0.15 }, { product: "poppy", each: 30 }, { product: "honey", each: 0.05 }, { product: "nuts", each: 20 },
    ],
  },
  {
    id: "sernik", name: "Sernik", kind: "deser",
    needs: [
      { product: "curd", each: 0.1 }, { product: "eggs", each: 0.6 }, { product: "butter", each: 0.1 }, { product: "sugar", each: 0.02 },
    ],
    ready: { product: "readyCheesecake", each: 0.12 },
  },
  {
    id: "pierniczki", name: "Pierniczki", kind: "deser",
    needs: [
      { product: "flour", each: 0.04 }, { product: "honey", each: 0.05 }, { product: "butter", each: 0.03 }, { product: "eggs", each: 0.1 },
      { product: "icingSugar", base: 0.6 }, { product: "gingerbreadSpice", base: 1 },
    ],
    ready: { product: "readyGingerbread", each: 0.25 },
  },
] as const satisfies readonly Dish[];

export type DishId = (typeof DISHES)[number]["id"];
export type DishPlan = "make" | "buy" | "bring" | "skip";

/** Besides the dishes. `people` counts guests at the table, `home` those who stay. */
export const EXTRAS = [
  {
    id: "stol", label: "Na stół", hint: "opłatek, sianko, świece, chleb, napoje", for: "people", on: true,
    needs: [
      { product: "wafer", base: 1 }, { product: "hay", base: 1 }, { product: "candles", base: 1 }, { product: "napkins", base: 1 },
      { product: "bread", each: 0.06 }, { product: "butter", each: 0.06 }, { product: "horseradish", base: 1 }, { product: "water", each: 0.5 },
      { product: "juice", each: 0.3 }, { product: "tea", base: 1 }, { product: "coffee", base: 1 }, { product: "mandarin", each: 0.2 }, { product: "walnuts", each: 30 },
    ],
  },
  {
    id: "sniadania", label: "Śniadania 25, 26 i 27 grudnia", hint: "trzy poranki bez sklepu", for: "home", on: true,
    needs: [
      { product: "eggs", each: 3 }, { product: "bread", each: 0.25 }, { product: "butter", each: 0.2 }, { product: "cheese", each: 0.09 },
      { product: "coldCuts", each: 0.12 }, { product: "tomato", each: 0.25 }, { product: "milk", each: 0.5 },
    ],
  },
  {
    id: "obiad-25", label: "Obiad 25 grudnia", hint: "pieczeń i ziemniaki", for: "home", on: true,
    needs: [{ product: "roast", each: 0.22 }, { product: "potato", each: 0.3 }, { product: "beetroot", each: 0.15 }, { product: "onion", each: 0.04 }],
  },
  {
    id: "obiad-26", label: "Obiad 26 grudnia", hint: "rosół, reszta z lodówki", for: "home", on: true,
    needs: [{ product: "soupMeat", each: 0.18 }, { product: "soupGreens", each: 0.2 }, { product: "soupNoodles", each: 0.2 }],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  hint: string;
  for: "people" | "home";
  on: boolean;
  needs: readonly N[];
}[];

export type ExtraId = (typeof EXTRAS)[number]["id"];

/** Nobody remembers these until the shops are shut. */
export const FORGOTTEN = [
  { id: "boxes", on: true },
  { id: "binBags", on: true },
  { id: "toiletPaper", on: true },
  { id: "dishwasher", on: false },
  { id: "bakingPaper", on: true },
  { id: "foil", on: false },
  { id: "matches", on: true },
  { id: "wrappingPaper", on: true },
  { id: "tape", on: true },
  { id: "batteries", on: false },
  { id: "petFood", on: false },
  { id: "medicine", on: false },
] as const satisfies readonly { id: ProductId; on: boolean }[];

export type ChristmasPlan = {
  people: number;
  home: number;
  dishes: Partial<Record<string, DishPlan>>;
  extras: Partial<Record<string, boolean>>;
  forgotten: Partial<Record<string, boolean>>;
};

export const DEFAULT_PLAN: ChristmasPlan = {
  people: 8,
  home: 4,
  dishes: {},
  extras: {},
  forgotten: {},
};

export const PEOPLE = { min: 2, max: 30 } as const;
export const HOME = { min: 1, max: 12 } as const;

export function dishPlan(plan: ChristmasPlan, dish: Dish): DishPlan {
  return plan.dishes[dish.id] ?? (dish.starter ? "make" : "skip");
}

/** Dishes that end up on the table, whoever makes them. */
export function onTheTable(plan: ChristmasPlan): Dish[] {
  return (DISHES as readonly Dish[]).filter((dish) => dishPlan(plan, dish) !== "skip");
}

export function christmasList(plan: ChristmasPlan): Line<When>[] {
  const needs: { need: N; people: number }[] = [];

  for (const dish of DISHES as readonly Dish[]) {
    const choice = dishPlan(plan, dish);
    if (choice === "make") {
      for (const need of dish.needs) needs.push({ need, people: plan.people });
    }
    if (choice === "buy" && dish.ready) {
      needs.push({ need: dish.ready, people: plan.people });
    }
  }
  for (const extra of EXTRAS) {
    if (!(plan.extras[extra.id] ?? extra.on)) continue;
    const people = extra.for === "home" ? plan.home : plan.people;
    for (const need of extra.needs) needs.push({ need, people });
  }
  for (const { id, on } of FORGOTTEN) {
    if (plan.forgotten[id] ?? on) needs.push({ need: { product: id, base: 1 }, people: 0 });
  }
  return addUp<ProductId, When>(PRODUCTS, needs);
}

/** What the family may bring, ready to send. Null when nobody brings anything. */
export function familyMessage(plan: ChristmasPlan): string | null {
  const names = (choice: DishPlan) =>
    (DISHES as readonly Dish[])
      .filter((dish) => dishPlan(plan, dish) === choice)
      .map((dish) => dish.name.toLocaleLowerCase("pl"));
  const bring = names("bring");
  if (bring.length === 0) return null;
  const ours = [...names("make"), ...names("buy")];
  return [
    `Wigilia, przy stole ${plural(plan.people, "osoba", "osoby", "osób")}.`,
    ours.length ? `U nas będzie: ${ours.join(", ")}.` : null,
    `Do przyniesienia: ${bring.join(", ")}.`,
    "Kto co bierze?",
  ]
    .filter(Boolean)
    .join(" ")
    .replaceAll(" ", " ");
}
