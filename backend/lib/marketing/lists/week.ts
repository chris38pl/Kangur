import type { Aisle } from "@/lib/marketing/aisles/labels";
import { addUp, type Line, type Need, type Product } from "@/lib/marketing/lists/build";
import { clampInt, isRecord } from "@/lib/marketing/lists/stored";

/**
 * A week of ordinary food. Split into one big trip and a small one in the middle of the
 * week, because what wilts is bought twice. `cupboard` lasts longer than a week.
 */
export type Trip = "main" | "topup" | "cupboard";

type P = Product<Trip>;
const p = (
  name: string,
  aisle: Aisle,
  unit: P["unit"],
  step: number,
  when: Trip,
  note?: string,
  small?: number,
): P => ({
  name,
  aisle,
  unit,
  step,
  when,
  ...(note ? { note } : {}),
  ...(small ? { small } : {}),
});

const PRODUCTS = {
  apples: p("Jabłka", "fruit", "kg", 0.5, "main"),
  bananas: p("Banany", "fruit", "kg", 0.5, "main", "weź też zielonkawe"),
  lemons: p("Cytryny", "fruit", "szt.", 1, "main"),
  potatoes: p("Ziemniaki", "vegetables", "kg", 1, "main"),
  carrots: p("Marchew", "vegetables", "kg", 0.5, "main"),
  onions: p("Cebula", "vegetables", "kg", 0.5, "main"),
  garlic: p("Czosnek (główka)", "vegetables", "szt.", 1, "main"),
  cabbage: p("Kapusta albo brokuł", "vegetables", "szt.", 1, "main"),
  tomatoes: p("Pomidory", "vegetables", "kg", 0.5, "main"),
  cucumbers: p("Ogórki", "vegetables", "kg", 0.5, "main"),
  eggs: p("Jajka", "dairy", "szt.", 10, "main", undefined, 6),
  butter: p("Masło (kostka)", "dairy", "szt.", 1, "main"),
  milk: p("Mleko", "dairy", "l", 1, "main"),
  cheese: p("Ser żółty", "dairy", "kg", 0.1, "main"),
  yogurt: p("Jogurt naturalny (kubek)", "dairy", "szt.", 1, "main"),
  feta: p("Ser sałatkowy", "dairy", "opak.", 1, "main"),
  coldCuts: p("Wędlina", "meat", "kg", 0.1, "main"),
  chicken: p("Kurczak (filet)", "meat", "kg", 0.25, "main", "połowa do zamrażarki"),
  mince: p("Mięso mielone", "meat", "kg", 0.25, "main", "do zamrażarki albo na pierwszy obiad"),
  bread: p("Chleb", "bakery", "kg", 0.5, "main", "krojony i część do zamrażarki"),
  frozenFish: p("Ryba mrożona", "frozen", "kg", 0.25, "main"),
  frozenVeg: p("Warzywa mrożone 450 g", "frozen", "opak.", 1, "main"),
  pasta: p("Makaron 500 g", "pantry", "opak.", 1, "main"),
  rice: p("Ryż 400 g", "pantry", "opak.", 1, "main"),
  groats: p("Kasza 400 g", "pantry", "opak.", 1, "main"),
  oats: p("Płatki owsiane 500 g", "pantry", "opak.", 1, "main"),
  pulses: p("Ciecierzyca albo fasola (puszka)", "pantry", "szt.", 1, "main"),
  passata: p("Passata (butelka)", "sauces", "szt.", 1, "main"),
  tofu: p("Tofu (kostka)", "vegetables", "szt.", 1, "main"),
  hummus: p("Hummus", "vegetables", "opak.", 1, "main"),
  nuts: p("Orzechy", "snacks", "g", 100, "main"),
  sweet: p("Coś słodkiego", "snacks", "szt.", 1, "main", "po jednym i uczciwie"),

  bread2: p("Chleb świeży", "bakery", "kg", 0.5, "topup"),
  milk2: p("Mleko", "dairy", "l", 1, "topup"),
  bananas2: p("Banany", "fruit", "kg", 0.5, "topup"),
  tomatoes2: p("Pomidory", "vegetables", "kg", 0.5, "topup"),
  salad: p("Sałata albo rukola", "vegetables", "opak.", 1, "topup"),
  herbs: p("Natka albo koperek", "vegetables", "szt.", 1, "topup"),
  curd: p("Twaróg 250 g", "dairy", "opak.", 1, "topup"),
  yogurt2: p("Jogurt naturalny (kubek)", "dairy", "szt.", 1, "topup"),

  oil: p("Olej albo oliwa", "pantry", "szt.", 1, "cupboard"),
  flour: p("Mąka", "pantry", "kg", 1, "cupboard"),
  sugar: p("Cukier", "pantry", "kg", 1, "cupboard"),
  salt: p("Sól i pieprz", "spices", "opak.", 1, "cupboard"),
  coffee: p("Kawa", "drinks", "opak.", 1, "cupboard"),
  tea: p("Herbata", "drinks", "opak.", 1, "cupboard"),
  toiletPaper: p("Papier toaletowy", "household", "opak.", 1, "cupboard"),
  binBags: p("Worki na śmieci", "household", "opak.", 1, "cupboard"),
  dishSoap: p("Płyn do naczyń", "cleaning", "szt.", 1, "cupboard"),
  laundry: p("Proszek do prania", "cleaning", "opak.", 1, "cupboard"),
} as const satisfies Record<string, P>;

type Id = keyof typeof PRODUCTS;
type N = Need<Id>;

/** Breakfast, supper and fruit for seven days, per person. */
const EVERY_DAY: readonly N[] = [
  { product: "bread", each: 0.2 }, { product: "butter", each: 0.45 }, { product: "cheese", each: 0.1 }, { product: "eggs", each: 4 },
  { product: "milk", each: 0.7 }, { product: "yogurt", each: 2 }, { product: "oats", each: 0.3 }, { product: "tomatoes", each: 0.3 },
  { product: "cucumbers", each: 0.25 }, { product: "apples", each: 0.6 }, { product: "bananas", each: 0.4 }, { product: "lemons", base: 1 },
  { product: "nuts", each: 50 }, { product: "sweet", each: 1 },
  { product: "bread2", each: 0.2 }, { product: "milk2", each: 0.5 }, { product: "bananas2", each: 0.3 }, { product: "tomatoes2", each: 0.25 },
  { product: "salad", base: 0.5, each: 0.2 }, { product: "herbs", base: 1 }, { product: "curd", each: 0.4 }, { product: "yogurt2", each: 1 },
];

/** One dinner at home, per person. */
const DINNER: readonly N[] = [
  { product: "potatoes", each: 0.1 }, { product: "pasta", each: 0.06 }, { product: "rice", each: 0.05 }, { product: "groats", each: 0.04 },
  { product: "carrots", each: 0.05 }, { product: "onions", each: 0.05 }, { product: "cabbage", each: 0.06 }, { product: "frozenVeg", each: 0.1 },
  { product: "passata", each: 0.08 },
];
const WITH_MEAT: readonly N[] = [
  { product: "chicken", each: 0.07 }, { product: "mince", each: 0.04 }, { product: "frozenFish", each: 0.03 }, { product: "pulses", each: 0.08 },
];
const WITHOUT_MEAT: readonly N[] = [
  { product: "tofu", each: 0.2 }, { product: "feta", each: 0.1 }, { product: "pulses", each: 0.25 },
];
const SANDWICH_MEAT: readonly N[] = [{ product: "coldCuts", each: 0.1 }];
const SANDWICH_OTHER: readonly N[] = [{ product: "hummus", each: 0.5 }];

const CUPBOARD: readonly N[] = (
  ["oil", "flour", "sugar", "salt", "coffee", "tea", "toiletPaper", "binBags", "dishSoap", "laundry"] as const
).map((product) => ({ product, base: 1 }));

export type WeekPlan = { people: number; dinners: number; meat: boolean; cupboard: boolean };

export const DEFAULT_WEEK: WeekPlan = { people: 2, dinners: 5, meat: true, cupboard: true };
export const WEEK_PEOPLE = { min: 1, max: 8 } as const;
export const WEEK_DINNERS = { min: 0, max: 7 } as const;

/** Whatever was left in the browser, turned into a plan the calculator can trust. */
export function readWeek(stored: unknown): WeekPlan {
  if (!isRecord(stored)) return DEFAULT_WEEK;
  return {
    people: clampInt(stored.people, WEEK_PEOPLE, DEFAULT_WEEK.people),
    dinners: clampInt(stored.dinners, WEEK_DINNERS, DEFAULT_WEEK.dinners),
    meat: typeof stored.meat === "boolean" ? stored.meat : DEFAULT_WEEK.meat,
    cupboard: typeof stored.cupboard === "boolean" ? stored.cupboard : DEFAULT_WEEK.cupboard,
  };
}

/** One person eats a bag of rice for a month, so it waits in the cupboard, not in the basket. */
const KEEPS: ReadonlySet<string> = new Set<Id>(["pasta", "rice", "groats", "oats", "nuts"]);

export function weekList(plan: WeekPlan): Line<Trip>[] {
  const needs: { need: N; people: number }[] = [];
  const add = (list: readonly N[], people: number) => {
    for (const need of list) needs.push({ need, people });
  };

  add(EVERY_DAY, plan.people);
  add(plan.meat ? SANDWICH_MEAT : SANDWICH_OTHER, plan.people);
  if (plan.dinners > 0) {
    const portions = plan.people * plan.dinners;
    add(DINNER, portions);
    add(plan.meat ? WITH_MEAT : WITHOUT_MEAT, portions);
    add([{ product: "garlic", base: 1 }], 0);
  }
  if (plan.cupboard) add(CUPBOARD, 0);
  const lines = addUp<Id, Trip>(PRODUCTS, needs);
  if (plan.people > 1 || !plan.cupboard) return lines;
  return lines.map((line): Line<Trip> =>
    KEEPS.has(line.id) ? { ...line, when: "cupboard", note: "starcza na kilka tygodni" } : line,
  );
}
