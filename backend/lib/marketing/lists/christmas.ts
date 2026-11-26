import type { Aisle } from "@/lib/marketing/aisles/labels";
import { addUp, type Line, type Need, type Product } from "@/lib/marketing/lists/build";
import { plural } from "@/lib/marketing/lists/format";
import { kangurPart, type KangurPart } from "@/lib/marketing/lists/parts";
import { clampInt, flags, isRecord } from "@/lib/marketing/lists/stored";
import { typesetCopy } from "@/lib/marketing/typography";

/**
 * Shopping for a Polish Christmas Eve and the days after it.
 *
 * Twelve dishes are twelve tastings, not twelve dinners: the amounts below are small
 * portions of home recipes, so that people get up from the table and the fridge closes.
 * When to buy: big shops are shut 24-27 December 2026, the last trading Sunday is the 20th.
 * Raw meat and fish are bought at the very end or go to the freezer.
 */
export type When = "early" | "weekend" | "last";

/**
 * The only season the calculator talks about. Next autumn: check the trading Sundays and the days
 * off, then follow the list in docs/deploy.md. `strip` is the last day the home page invites
 * people to the calculator, `over` the last day its dates are in the future.
 */
export const CHRISTMAS = {
  year: 2026,
  /** Last days of the first two trips. Later they are simply the next trip. */
  early: "2026-12-13",
  weekend: "2026-12-20",
  strip: "2026-12-23",
  over: "2026-12-27",
} as const;

type P = Product<When>;
const p = (
  name: string,
  aisle: Aisle,
  unit: P["unit"],
  step: number,
  when: When,
  more: Pick<P, "note" | "small"> = {},
): P => ({ name, aisle, unit, step, when, ...more });

export const PRODUCTS = {
  // Vegetables and fruit
  beetroot: p("Buraki", "vegetables", "kg", 0.5, "weekend"),
  carrot: p("Marchew", "vegetables", "kg", 0.5, "weekend"),
  parsley: p("Pietruszka (korzeń)", "vegetables", "kg", 0.25, "weekend"),
  celeriac: p("Seler (korzeń)", "vegetables", "szt.", 1, "weekend"),
  soupGreens: p("Włoszczyzna (pęczek)", "vegetables", "szt.", 1, "weekend"),
  onion: p("Cebula", "vegetables", "kg", 0.5, "weekend"),
  garlic: p("Czosnek (główka)", "vegetables", "szt.", 1, "weekend"),
  potato: p("Ziemniaki", "vegetables", "kg", 0.5, "weekend"),
  sauerkraut: p("Kapusta kiszona", "vegetables", "kg", 0.5, "weekend"),
  cabbage: p("Kapusta biała (główka)", "vegetables", "szt.", 1, "weekend"),
  pickles: p("Ogórki kiszone", "vegetables", "kg", 0.25, "weekend"),
  beetKvass: p("Zakwas buraczany", "vegetables", "l", 0.5, "weekend"),
  tomato: p("Pomidory", "vegetables", "kg", 0.5, "last"),
  hummus: p("Hummus", "vegetables", "opak.", 1, "last"),
  apple: p("Jabłka kwaśne", "fruit", "kg", 0.5, "weekend"),
  lemon: p("Cytryny", "fruit", "szt.", 1, "weekend"),
  mandarin: p("Mandarynki", "fruit", "kg", 0.5, "weekend"),

  // Fish and meat
  carp: p("Karp (dzwonka albo filety)", "fish", "kg", 0.25, "last"),
  herring: p("Śledzie (płaty)", "fish", "kg", 0.25, "weekend"),
  whiteFish: p("Biała ryba (filety)", "fish", "kg", 0.25, "last", { note: "może być mrożona" }),
  roast: p("Mięso na pieczeń", "meat", "kg", 0.25, "last"),
  soupMeat: p("Porcja rosołowa", "meat", "kg", 0.25, "weekend", { note: "zamroź, na rosół 26 grudnia" }),
  coldCuts: p("Wędlina", "meat", "kg", 0.1, "last"),

  // Dairy
  eggs: p("Jajka", "dairy", "szt.", 10, "weekend", { small: 6 }),
  butter: p("Masło (kostka)", "dairy", "szt.", 1, "weekend"),
  ghee: p("Masło klarowane 250 g", "dairy", "szt.", 1, "weekend"),
  sourCream: p("Śmietana 18% (kubek 400 g)", "dairy", "szt.", 1, "weekend"),
  curd: p("Twaróg na sernik", "dairy", "kg", 0.5, "weekend"),
  cheese: p("Ser żółty", "dairy", "kg", 0.1, "last"),
  milk: p("Mleko", "dairy", "l", 1, "last"),

  // Bakery
  bread: p("Chleb", "bakery", "kg", 0.5, "last", { note: "pokrojony przetrwa w zamrażarce" }),
  wafer: p("Opłatek", "bakery", "opak.", 1, "early"),

  // Pantry
  flour: p("Mąka pszenna", "pantry", "kg", 1, "early"),
  sugar: p("Cukier", "pantry", "kg", 1, "early"),
  icingSugar: p("Cukier puder", "pantry", "opak.", 1, "early"),
  soda: p("Soda oczyszczona", "pantry", "opak.", 1, "early"),
  salt: p("Sól", "pantry", "opak.", 1, "early"),
  oil: p("Olej", "pantry", "l", 1, "early"),
  driedMushrooms: p("Suszone grzyby", "pantry", "g", 20, "early"),
  splitPeas: p("Groch łuskany", "pantry", "kg", 0.5, "early"),
  beans: p("Fasola Jaś", "pantry", "kg", 0.5, "early"),
  driedFruit: p("Susz owocowy na kompot", "pantry", "g", 100, "early"),
  prunes: p("Suszone śliwki", "pantry", "g", 100, "early"),
  wheat: p("Pszenica na kutię", "pantry", "g", 100, "early"),
  poppy: p("Mak", "pantry", "g", 100, "early"),
  poppyPaste: p("Masa makowa (puszka 850 g)", "pantry", "szt.", 1, "early"),
  nuts: p("Bakalie (rodzynki i orzechy)", "pantry", "g", 100, "early"),
  honey: p("Miód (słoik)", "pantry", "szt.", 1, "early"),
  buckwheat: p("Kasza gryczana", "pantry", "kg", 0.5, "early"),
  // Not "Makaron łazanki": Kangur keeps one product of a name, and three pastas would be one.
  noodles: p("Łazanki 400 g", "pantry", "opak.", 1, "early"),
  soupNoodles: p("Nitki do rosołu 250 g", "pantry", "opak.", 1, "early"),
  pasta: p("Makaron 500 g", "pantry", "opak.", 1, "early"),
  yeast: p("Drożdże (kostka 100 g)", "pantry", "szt.", 1, "weekend"),
  peas: p("Groszek konserwowy (puszka)", "pantry", "szt.", 1, "early"),
  tomatoPaste: p("Koncentrat pomidorowy (słoiczek)", "pantry", "szt.", 1, "early"),
  puffPastry: p("Ciasto francuskie", "frozen", "opak.", 1, "weekend"),

  // Spices and sauces
  pepper: p("Pieprz", "spices", "opak.", 1, "early"),
  bayLeaf: p("Liść laurowy", "spices", "opak.", 1, "early"),
  allspice: p("Ziele angielskie", "spices", "opak.", 1, "early"),
  marjoram: p("Majeranek", "spices", "opak.", 1, "early"),
  cloves: p("Goździki", "spices", "opak.", 1, "early"),
  cinnamon: p("Cynamon w laskach", "spices", "opak.", 1, "early"),
  gingerbreadSpice: p("Przyprawa do piernika", "spices", "opak.", 1, "early"),
  mayo: p("Majonez (słoik 400 g)", "sauces", "szt.", 1, "early"),
  horseradish: p("Chrzan (słoik)", "sauces", "szt.", 1, "early"),
  passata: p("Passata (butelka)", "sauces", "szt.", 1, "early"),

  // Ready to eat
  readyBorscht: p("Barszcz czerwony (karton 1 l)", "pantry", "szt.", 1, "early"),
  readyUszka: p("Uszka z grzybami 300 g", "frozen", "opak.", 1, "weekend"),
  readyPierogi: p("Pierogi z kapustą i grzybami", "frozen", "kg", 0.5, "weekend"),
  readyCarp: p("Karp smażony (gotowy)", "fish", "kg", 0.25, "last"),
  readyHerringOil: p("Śledzie w oleju (gotowe)", "fish", "opak.", 1, "weekend"),
  readyHerringCream: p("Śledzie w śmietanie (gotowe)", "fish", "opak.", 1, "last"),
  readyGreekFish: p("Ryba po grecku (gotowa)", "fish", "kg", 0.5, "last"),
  readyCabbage: p("Kapusta z grochem (gotowa)", "other", "kg", 0.5, "last"),
  readySalad: p("Sałatka jarzynowa (gotowa)", "other", "kg", 0.5, "last"),
  readyKompot: p("Kompot z suszu (butelka 1 l)", "drinks", "szt.", 1, "early"),
  readyKutia: p("Kutia (gotowa)", "other", "kg", 0.5, "last"),
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
  hay: p("Sianko", "household", "opak.", 1, "early"),
  candles: p("Świece", "household", "opak.", 1, "early"),
  napkins: p("Serwetki", "household", "opak.", 1, "early"),

  // What people forget
  boxes: p("Pojemniki na resztki", "household", "opak.", 1, "early"),
  matches: p("Zapałki", "household", "opak.", 1, "early"),
  bakingPaper: p("Papier do pieczenia", "household", "opak.", 1, "early"),
  foil: p("Folia aluminiowa", "household", "opak.", 1, "early"),
  wrappingPaper: p("Papier do pakowania prezentów", "household", "szt.", 2, "early"),
  tape: p("Taśma klejąca", "household", "szt.", 1, "early"),
  batteries: p("Baterie AA i AAA", "electronics", "opak.", 1, "early"),
  binBags: p("Worki na śmieci", "household", "opak.", 1, "early"),
  dishwasher: p("Tabletki do zmywarki", "cleaning", "opak.", 1, "early"),
  toiletPaper: p("Papier toaletowy", "household", "opak.", 1, "early"),
  petFood: p("Karma dla zwierzaka", "pets", "opak.", 1, "weekend"),
  medicine: p("Kończące się leki", "pharmacy", "opak.", 1, "weekend"),
} as const satisfies Record<string, P>;

export type ProductId = keyof typeof PRODUCTS;
type N = Need<ProductId>;

export type Dish = {
  id: string;
  name: string;
  needs: readonly N[];
  /** What to put in the basket when nobody feels like cooking it. */
  ready?: N;
  /** One of the twelve we start with. */
  starter?: boolean;
};

export const DISHES = [
  {
    id: "barszcz", name: "Barszcz czerwony", starter: true,
    needs: [
      { product: "beetroot", each: 0.18 }, { product: "beetKvass", each: 0.1 }, { product: "soupGreens", each: 0.15 },
      { product: "driedMushrooms", each: 4 }, { product: "garlic", each: 0.1 },
      { product: "bayLeaf", base: 0.3 }, { product: "allspice", base: 0.3 }, { product: "marjoram", base: 0.3 },
    ],
    ready: { product: "readyBorscht", each: 0.25 },
  },
  {
    id: "uszka", name: "Uszka z grzybami", starter: true,
    needs: [
      { product: "flour", each: 0.035 }, { product: "driedMushrooms", each: 8 }, { product: "onion", each: 0.03 }, { product: "eggs", each: 0.12 },
    ],
    ready: { product: "readyUszka", each: 0.3 },
  },
  {
    id: "karp", name: "Karp smażony", starter: true,
    needs: [
      { product: "carp", each: 0.2 }, { product: "flour", each: 0.015 }, { product: "ghee", each: 0.08 }, { product: "lemon", each: 0.2 },
    ],
    ready: { product: "readyCarp", each: 0.15 },
  },
  {
    id: "sledz-olej", name: "Śledź w oleju", starter: true,
    needs: [
      { product: "herring", each: 0.07 }, { product: "onion", each: 0.04 }, { product: "oil", each: 0.03 },
      { product: "allspice", base: 0.2 }, { product: "bayLeaf", base: 0.2 },
    ],
    ready: { product: "readyHerringOil", each: 0.2 },
  },
  {
    id: "sledz-smietana", name: "Śledź w śmietanie", starter: true,
    needs: [
      { product: "herring", each: 0.07 }, { product: "sourCream", each: 0.1 }, { product: "apple", each: 0.04 }, { product: "onion", each: 0.02 },
    ],
    ready: { product: "readyHerringCream", each: 0.2 },
  },
  {
    id: "pierogi", name: "Pierogi z kapustą i grzybami", starter: true,
    needs: [
      { product: "flour", each: 0.08 }, { product: "sauerkraut", each: 0.1 }, { product: "driedMushrooms", each: 6 },
      { product: "onion", each: 0.04 }, { product: "eggs", each: 0.1 }, { product: "oil", each: 0.01 },
    ],
    ready: { product: "readyPierogi", each: 0.15 },
  },
  {
    id: "kapusta", name: "Kapusta z grochem", starter: true,
    needs: [
      { product: "sauerkraut", each: 0.12 }, { product: "splitPeas", each: 0.04 }, { product: "onion", each: 0.03 }, { product: "oil", each: 0.01 },
      { product: "bayLeaf", base: 0.2 }, { product: "allspice", base: 0.2 },
    ],
    ready: { product: "readyCabbage", each: 0.12 },
  },
  {
    id: "ryba-po-grecku", name: "Ryba po grecku", starter: true,
    needs: [
      { product: "whiteFish", each: 0.12 }, { product: "carrot", each: 0.08 }, { product: "parsley", each: 0.025 },
      { product: "celeriac", each: 0.05 }, { product: "onion", each: 0.03 }, { product: "tomatoPaste", each: 0.12 },
      { product: "flour", each: 0.01 }, { product: "oil", each: 0.02 },
    ],
    ready: { product: "readyGreekFish", each: 0.15 },
  },
  {
    id: "salatka", name: "Sałatka jarzynowa", starter: true,
    needs: [
      { product: "potato", each: 0.08 }, { product: "carrot", each: 0.05 }, { product: "parsley", each: 0.015 }, { product: "eggs", each: 0.5 },
      { product: "peas", each: 0.125 }, { product: "pickles", each: 0.05 }, { product: "apple", each: 0.04 }, { product: "mayo", each: 0.1 },
    ],
    ready: { product: "readySalad", each: 0.15 },
  },
  {
    id: "kompot", name: "Kompot z suszu", starter: true,
    needs: [
      { product: "driedFruit", each: 45 }, { product: "sugar", each: 0.015 }, { product: "cloves", base: 0.3 }, { product: "cinnamon", base: 0.5 },
    ],
    ready: { product: "readyKompot", each: 0.25 },
  },
  {
    id: "kutia", name: "Kutia", starter: true,
    needs: [
      { product: "wheat", each: 30 }, { product: "poppy", each: 30 }, { product: "honey", each: 0.06 }, { product: "nuts", each: 30 },
    ],
    ready: { product: "readyKutia", each: 0.1 },
  },
  {
    id: "makowiec", name: "Makowiec", starter: true,
    needs: [
      { product: "poppyPaste", each: 0.12 }, { product: "flour", each: 0.04 }, { product: "yeast", each: 0.03 }, { product: "butter", each: 0.05 },
      { product: "milk", each: 0.02 }, { product: "eggs", each: 0.25 }, { product: "sugar", each: 0.01 }, { product: "icingSugar", base: 0.4 },
    ],
    ready: { product: "readyPoppyCake", each: 0.12 },
  },
  {
    id: "grzybowa", name: "Zupa grzybowa",
    needs: [
      { product: "driedMushrooms", each: 12 }, { product: "soupGreens", each: 0.15 }, { product: "sourCream", each: 0.08 },
      { product: "noodles", each: 0.1 }, { product: "onion", each: 0.03 },
    ],
  },
  {
    id: "golabki", name: "Gołąbki z kaszą i grzybami",
    needs: [
      { product: "cabbage", each: 0.12 }, { product: "buckwheat", each: 0.05 }, { product: "driedMushrooms", each: 6 },
      { product: "onion", each: 0.04 }, { product: "oil", each: 0.01 },
    ],
  },
  {
    id: "fasola", name: "Fasola ze śliwkami",
    needs: [{ product: "beans", each: 0.05 }, { product: "prunes", each: 30 }, { product: "butter", each: 0.04 }],
  },
  {
    id: "paszteciki", name: "Paszteciki do barszczu",
    needs: [
      { product: "puffPastry", each: 0.2 }, { product: "sauerkraut", each: 0.06 }, { product: "driedMushrooms", each: 4 },
      { product: "onion", each: 0.02 }, { product: "eggs", each: 0.1 },
    ],
    ready: { product: "readyPasties", each: 2 },
  },
  {
    id: "kluski", name: "Kluski z makiem",
    needs: [
      { product: "noodles", each: 0.15 }, { product: "poppy", each: 30 }, { product: "honey", each: 0.05 }, { product: "nuts", each: 20 },
    ],
  },
  {
    id: "sernik", name: "Sernik",
    needs: [
      { product: "curd", each: 0.1 }, { product: "eggs", each: 0.6 }, { product: "butter", each: 0.1 }, { product: "sugar", each: 0.02 },
    ],
    ready: { product: "readyCheesecake", each: 0.12 },
  },
  {
    id: "pierniczki", name: "Pierniczki",
    needs: [
      { product: "flour", each: 0.04 }, { product: "honey", each: 0.05 }, { product: "butter", each: 0.03 }, { product: "eggs", each: 0.1 },
      { product: "icingSugar", base: 0.6 }, { product: "gingerbreadSpice", base: 1 }, { product: "soda", base: 0.3 },
    ],
    ready: { product: "readyGingerbread", each: 0.25 },
  },
] as const satisfies readonly Dish[];

export type DishId = (typeof DISHES)[number]["id"];

const DISH_PLANS = ["make", "buy", "bring", "skip"] as const;
export type DishPlan = (typeof DISH_PLANS)[number];

type Extra = {
  id: string;
  label: string;
  hint: string;
  for: "people" | "home";
  on: boolean;
  needs: readonly N[];
  /** The same meal for people who do not eat meat. */
  meatless?: { hint?: string; needs: readonly N[] };
};

/** Besides the dishes. `people` counts guests at the table, `home` those who stay. */
export const EXTRAS = [
  {
    id: "stol", label: "Na stół", hint: "chleb, masło, chrzan, napoje, mandarynki", for: "people", on: true,
    needs: [
      { product: "bread", each: 0.06 }, { product: "butter", each: 0.06 }, { product: "horseradish", base: 1 }, { product: "napkins", base: 1 },
      { product: "water", each: 0.5 }, { product: "juice", each: 0.3 }, { product: "tea", base: 1 }, { product: "coffee", base: 1 },
      { product: "mandarin", each: 0.2 }, { product: "walnuts", each: 30 },
    ],
  },
  {
    id: "zwyczaje", label: "Zwyczaje", hint: "opłatek, sianko, świece", for: "people", on: true,
    needs: [{ product: "wafer", base: 1 }, { product: "hay", base: 1 }, { product: "candles", base: 1 }],
  },
  {
    id: "dzien-24", label: "24 grudnia bez Wigilii", hint: "śniadanie i makaron na obiad", for: "home", on: false,
    needs: [
      { product: "eggs", each: 1 }, { product: "bread", each: 0.1 }, { product: "butter", each: 0.06 }, { product: "milk", each: 0.15 },
      { product: "cheese", each: 0.05 }, { product: "pasta", each: 0.25 }, { product: "passata", each: 0.3 },
    ],
  },
  {
    id: "sniadania", label: "Śniadania 25, 26 i 27 grudnia", hint: "trzy poranki bez sklepu", for: "home", on: true,
    needs: [
      { product: "eggs", each: 3 }, { product: "bread", each: 0.25 }, { product: "butter", each: 0.2 }, { product: "cheese", each: 0.09 },
      { product: "coldCuts", each: 0.12 }, { product: "tomato", each: 0.25 }, { product: "milk", each: 0.5 },
    ],
    meatless: {
      needs: [
        { product: "eggs", each: 3 }, { product: "bread", each: 0.25 }, { product: "butter", each: 0.2 }, { product: "cheese", each: 0.14 },
        { product: "hummus", each: 0.4 }, { product: "tomato", each: 0.25 }, { product: "milk", each: 0.5 },
      ],
    },
  },
  {
    id: "obiad-25", label: "Obiad 25 grudnia", hint: "pieczeń i ziemniaki", for: "home", on: true,
    needs: [{ product: "roast", each: 0.22 }, { product: "potato", each: 0.3 }, { product: "beetroot", each: 0.15 }, { product: "onion", each: 0.04 }],
    meatless: {
      hint: "ziemniaki zapiekane z serem",
      needs: [
        { product: "potato", each: 0.35 }, { product: "cheese", each: 0.1 }, { product: "sourCream", each: 0.15 },
        { product: "beetroot", each: 0.15 }, { product: "onion", each: 0.04 },
      ],
    },
  },
  {
    id: "obiad-26", label: "Obiad 26 grudnia", hint: "rosół, reszta z lodówki", for: "home", on: true,
    needs: [{ product: "soupMeat", each: 0.18 }, { product: "soupGreens", each: 0.2 }, { product: "soupNoodles", each: 0.2 }],
    meatless: {
      hint: "zupa jarzynowa z makaronem, reszta z lodówki",
      needs: [{ product: "soupGreens", each: 0.25 }, { product: "soupNoodles", each: 0.2 }, { product: "potato", each: 0.1 }, { product: "butter", each: 0.03 }],
    },
  },
  {
    id: "obiad-27", label: "Obiad 27 grudnia", hint: "kasza z jajkiem, gdy resztek zabraknie", for: "home", on: false,
    needs: [{ product: "buckwheat", each: 0.08 }, { product: "eggs", each: 2 }, { product: "pickles", each: 0.1 }, { product: "onion", each: 0.04 }, { product: "butter", each: 0.05 }],
  },
] as const satisfies readonly Extra[];

/** Nobody remembers these until the shops are shut. */
export const FORGOTTEN = [
  { id: "boxes", on: true },
  { id: "salt", on: true },
  { id: "pepper", on: true },
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

/** A dish from outside our list: it counts and goes into the message, we do not know what is in it. */
export type OwnDish = { name: string; plan: "make" | "bring" };

export type ChristmasPlan = {
  people: number;
  home: number;
  meat: boolean;
  /** The extra plate for somebody who knocks on the door. */
  seat: boolean;
  dishes: Partial<Record<string, DishPlan>>;
  extras: Partial<Record<string, boolean>>;
  forgotten: Partial<Record<string, boolean>>;
  own: readonly OwnDish[];
};

export const DEFAULT_PLAN: ChristmasPlan = {
  people: 8,
  home: 4,
  meat: true,
  seat: false,
  dishes: {},
  extras: {},
  forgotten: {},
  own: [],
};

export const PEOPLE = { min: 1, max: 30 } as const;
export const HOME = { min: 1, max: 12 } as const;
export const OWN = { max: 6, length: 40 } as const;

/** Whatever was left in the browser, turned into a plan the calculator can trust. */
export function readPlan(stored: unknown): ChristmasPlan {
  if (!isRecord(stored)) return DEFAULT_PLAN;
  const dishes: Partial<Record<string, DishPlan>> = {};
  if (isRecord(stored.dishes)) {
    for (const { id } of DISHES) {
      const choice = DISH_PLANS.find((plan) => plan === (stored.dishes as Record<string, unknown>)[id]);
      if (choice) dishes[id] = choice;
    }
  }
  const own: OwnDish[] = (Array.isArray(stored.own) ? stored.own : [])
    .filter((dish): dish is Record<string, unknown> => isRecord(dish) && typeof dish.name === "string")
    .map((dish): OwnDish => ({
      name: String(dish.name).trim().slice(0, OWN.length),
      plan: dish.plan === "bring" ? "bring" : "make",
    }))
    .filter((dish) => dish.name)
    .slice(0, OWN.max);
  return {
    people: clampInt(stored.people, PEOPLE, DEFAULT_PLAN.people),
    home: clampInt(stored.home, HOME, DEFAULT_PLAN.home),
    meat: typeof stored.meat === "boolean" ? stored.meat : DEFAULT_PLAN.meat,
    seat: stored.seat === true,
    dishes,
    extras: flags(stored.extras, EXTRAS.map((extra) => extra.id)),
    forgotten: flags(stored.forgotten, FORGOTTEN.map(({ id }) => id)),
    own,
  };
}

/** Only what differs from the plan everybody starts with, for the code that a phone scans. */
export function planChanges(plan: ChristmasPlan): Partial<ChristmasPlan> {
  const dishes = Object.fromEntries(
    (DISHES as readonly Dish[]).flatMap((dish) => {
      const choice = dishPlan(plan, dish);
      return choice === dishPlan(DEFAULT_PLAN, dish) ? [] : [[dish.id, choice] as const];
    }),
  );
  const extras = Object.fromEntries(
    (EXTRAS as readonly Extra[]).flatMap((extra) => {
      const on = extraOn(plan, extra);
      return on === extra.on ? [] : [[extra.id, on] as const];
    }),
  );
  const forgotten = Object.fromEntries(
    FORGOTTEN.flatMap(({ id, on }) => {
      const chosen = plan.forgotten[id] ?? on;
      return chosen === on ? [] : [[id, chosen] as const];
    }),
  );
  const { people, home, meat, seat, own } = plan;
  return {
    ...(people === DEFAULT_PLAN.people ? {} : { people }),
    ...(home === DEFAULT_PLAN.home ? {} : { home }),
    ...(meat === DEFAULT_PLAN.meat ? {} : { meat }),
    ...(seat === DEFAULT_PLAN.seat ? {} : { seat }),
    ...(Object.keys(dishes).length === 0 ? {} : { dishes }),
    ...(Object.keys(extras).length === 0 ? {} : { extras }),
    ...(Object.keys(forgotten).length === 0 ? {} : { forgotten }),
    ...(own.length === 0 ? {} : { own }),
  };
}

export function dishPlan(plan: ChristmasPlan, dish: Dish): DishPlan {
  return plan.dishes[dish.id] ?? (dish.starter ? "make" : "skip");
}

export const extraOn = (plan: ChristmasPlan, extra: Extra): boolean => plan.extras[extra.id] ?? extra.on;

/** Dishes from our list that end up on the table, whoever makes them. */
export function onTheTable(plan: ChristmasPlan): Dish[] {
  return (DISHES as readonly Dish[]).filter((dish) => dishPlan(plan, dish) !== "skip");
}

export const dishCount = (plan: ChristmasPlan): number => onTheTable(plan).length + plan.own.length;

/** Nobody stays for the next days who was not at the table. Without a table there is no limit. */
export const mostStaying = (plan: ChristmasPlan): number =>
  dishCount(plan) === 0 ? HOME.max : Math.min(HOME.max, Math.max(plan.people, HOME.min));

/** The number typed in is kept, so eight guests, two guests and eight again leave four at home. */
export const staying = (plan: ChristmasPlan): number => Math.min(plan.home, mostStaying(plan));

/** Somebody else's Christmas, one tap away. */
export const PRESETS = [
  { id: "twelve", label: "Dwanaście dań" },
  { id: "six", label: "Sześć dań" },
  { id: "no-fish", label: "Bez ryb" },
  { id: "no-eve", label: "Tylko cztery dni bez sklepu" },
] as const;
export type PresetId = (typeof PRESETS)[number]["id"];

const PRESET_DISHES: Record<PresetId, readonly DishId[]> = {
  twelve: (DISHES as readonly Dish[]).filter((dish) => dish.starter).map((dish) => dish.id as DishId),
  six: ["barszcz", "uszka", "karp", "sledz-olej", "pierogi", "kompot"],
  "no-fish": [
    "barszcz", "uszka", "grzybowa", "pierogi", "kapusta", "golabki", "fasola", "salatka", "kluski", "kutia", "makowiec", "kompot",
  ],
  "no-eve": [],
};

export function applyPreset(plan: ChristmasPlan, id: PresetId): ChristmasPlan {
  const chosen: ReadonlySet<string> = new Set(PRESET_DISHES[id]);
  const noEve = id === "no-eve";
  return {
    ...plan,
    seat: noEve ? false : plan.seat,
    own: noEve ? [] : plan.own,
    dishes: Object.fromEntries(
      (DISHES as readonly Dish[]).map((dish): [string, DishPlan] => {
        const before = dishPlan(plan, dish);
        if (!chosen.has(dish.id)) return [dish.id, "skip"];
        return [dish.id, before === "skip" ? "make" : before];
      }),
    ),
    extras: { ...plan.extras, zwyczaje: !noEve, "dzien-24": noEve, "obiad-27": noEve },
    forgotten: { ...plan.forgotten, wrappingPaper: !noEve, tape: !noEve, matches: !noEve },
  };
}

/** The preset the plan still matches, if nobody has changed its dishes since. */
export function activePreset(plan: ChristmasPlan): PresetId | null {
  const table = onTheTable(plan).map((dish) => dish.id);
  const on = (id: string) => (EXTRAS as readonly Extra[]).some((extra) => extra.id === id && extraOn(plan, extra));
  const same = (id: PresetId) =>
    PRESET_DISHES[id].length === table.length &&
    table.every((dish) => (PRESET_DISHES[id] as readonly string[]).includes(dish)) &&
    // "Twelve dishes" and one more is thirteen. A Wigilia without fish may have anything else.
    (id === "no-fish" || plan.own.length === 0) &&
    // Skipping every dish by hand leaves the wafer and nothing to eat on the 24th.
    (id !== "no-eve" || (on("dzien-24") && !on("zwyczaje")));
  return PRESETS.find(({ id }) => same(id))?.id ?? null;
}

export function christmasList(plan: ChristmasPlan): Line<When>[] {
  const needs: { need: N; people: number }[] = [];
  // Without a Christmas Eve the table is for those who stay.
  const guests = dishCount(plan) === 0 ? plan.home : plan.people + (plan.seat ? 1 : 0);

  for (const dish of DISHES as readonly Dish[]) {
    const choice = dishPlan(plan, dish);
    if (choice === "make") {
      for (const need of dish.needs) needs.push({ need, people: guests });
    }
    if (choice === "buy" && dish.ready) {
      needs.push({ need: dish.ready, people: guests });
    }
  }
  for (const extra of EXTRAS as readonly Extra[]) {
    if (!extraOn(plan, extra)) continue;
    const people = extra.for === "home" ? staying(plan) : guests;
    const list = plan.meat ? extra.needs : (extra.meatless?.needs ?? extra.needs);
    for (const need of list) needs.push({ need, people });
  }
  for (const { id, on } of FORGOTTEN) {
    if (plan.forgotten[id] ?? on) needs.push({ need: { product: id, base: 1 }, people: 0 });
  }
  return addUp<ProductId, When>(PRODUCTS, needs);
}

/** When to buy what. Every date is a trip to the shop, and a list of its own in Kangur. */
export type ShopTrip = {
  id: string;
  title: string;
  hint: string;
  /** Which products go on this trip. */
  covers: readonly When[];
};

const EARLY: ShopTrip = { id: "early", title: "Do 13 grudnia", hint: "Suche, w słoikach i puszkach. Poczeka w szafce.", covers: ["early"] };
const WEEKEND: ShopTrip = { id: "weekend", title: "19 i 20 grudnia", hint: "Ostatni weekend. 20 grudnia to niedziela handlowa.", covers: ["weekend"] };
const LAST: ShopTrip = { id: "last", title: "22 i 23 grudnia", hint: "Świeże. Od 24 do 27 grudnia duże sklepy są zamknięte.", covers: ["last"] };
const NEXT = { id: "next", title: "Najbliższe zakupy", hint: "Suche, w słoikach i puszkach. Kup je przy najbliższej okazji." } as const;

/**
 * When to buy what, seen from `today` (as "2026-12-16", null for the static page). A date that
 * has passed becomes the next trip, so nobody gets a list called "do 13 grudnia" on the 16th.
 */
export function tripsOn(today: string | null): readonly ShopTrip[] {
  const trips: ShopTrip[] =
    today === null || today <= CHRISTMAS.early
      ? [EARLY, WEEKEND, LAST]
      : today <= CHRISTMAS.weekend
        ? [{ ...NEXT, covers: ["early"] }, WEEKEND, LAST]
        : [{ ...NEXT, hint: "Wszystko, co nie jest świeże. Kup je przy najbliższej okazji.", covers: ["early", "weekend"] }, LAST];
  return typesetCopy(trips);
}

/** Three trips, three lists in Kangur, or one. Kangur names a list after its first line. */
export function christmasTrips(
  plan: ChristmasPlan,
  lines: readonly Line<When>[],
  trips: readonly ShopTrip[] = tripsOn(null),
): { whole: KangurPart; trips: KangurPart[] } {
  const wigilia = dishCount(plan) > 0;
  const name = wigilia ? "Zakupy na święta" : "Zakupy na zapas";
  return {
    whole: kangurPart("whole", "Wszystko", wigilia ? "Zakupy na Wigilię i święta" : "Zakupy na cztery dni bez sklepu", lines),
    trips: trips
      .map(({ id, title, covers }) =>
        kangurPart(
          id,
          title,
          id === NEXT.id ? `Najbliższe ${name.toLocaleLowerCase("pl")}` : `${name} ${title.toLocaleLowerCase("pl")}`,
          lines.filter((line) => covers.includes(line.when)),
        ),
      )
      .filter((part) => part.count > 0),
  };
}

/** Title of the list, on the screen and in a message. */
export function christmasTitle(plan: ChristmasPlan): string {
  return dishCount(plan) > 0
    ? `Lista zakupów na Wigilię i święta ${CHRISTMAS.year}, ${plural(plan.people, "osoba", "osoby", "osób")}`
    : `Lista zakupów na cztery dni bez sklepu, ${plural(plan.home, "osoba", "osoby", "osób")}`;
}

const lower = (name: string) => name.toLocaleLowerCase("pl");

/** What stands on the table and who brings what, for the end of the calculator and the message. */
export function menu(plan: ChristmasPlan): { ours: string[]; bring: string[] } {
  const ours: string[] = [];
  const bring: string[] = [];
  for (const dish of onTheTable(plan)) {
    (dishPlan(plan, dish) === "bring" ? bring : ours).push(lower(dish.name));
  }
  for (const dish of plan.own) (dish.plan === "bring" ? bring : ours).push(lower(dish.name));
  return { ours, bring };
}

/** What the family may bring, ready to send. Null when nobody brings anything. */
export function familyMessage(plan: ChristmasPlan): string | null {
  const { ours, bring } = menu(plan);
  if (bring.length === 0) return null;
  return [
    `Wigilia, przy stole ${plural(plan.people, "osoba", "osoby", "osób")}.`,
    ours.length ? `U nas będzie: ${ours.join(", ")}.` : null,
    `Do przyniesienia: ${bring.join(", ")}.`,
    "Kto co bierze? Terminy zakupów: getkangur.com/wigilia",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s/gu, " ");
}
