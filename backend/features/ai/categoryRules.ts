import type { AiOutputLanguage } from "./outputLanguage";

type CategoryExamples = {
  flour: string;
  pasta: string;
  breadcrumbs: string;
  beer: string;
  salt: string;
  pesto: string;
  passata: string;
};

const EXAMPLES: Record<AiOutputLanguage, CategoryExamples> = {
  pl: {
    flour: "Mąka",
    pasta: "Makaron",
    breadcrumbs: "Bułka tarta",
    beer: "Piwo",
    salt: "Sól",
    pesto: "Sos pesto",
    passata: "Passata",
  },
  en: {
    flour: "Flour",
    pasta: "Pasta",
    breadcrumbs: "Breadcrumbs",
    beer: "Beer",
    salt: "Salt",
    pesto: "Pesto",
    passata: "Passata",
  },
  de: {
    flour: "Mehl",
    pasta: "Nudeln",
    breadcrumbs: "Paniermehl",
    beer: "Bier",
    salt: "Salz",
    pesto: "Pesto",
    passata: "Passata",
  },
  fr: {
    flour: "Farine",
    pasta: "Pâtes",
    breadcrumbs: "Chapelure",
    beer: "Bière",
    salt: "Sel",
    pesto: "Pesto",
    passata: "Passata",
  },
  es: {
    flour: "Harina",
    pasta: "Pasta",
    breadcrumbs: "Pan rallado",
    beer: "Cerveza",
    salt: "Sal",
    pesto: "Pesto",
    passata: "Passata",
  },
  it: {
    flour: "Farina",
    pasta: "Pasta",
    breadcrumbs: "Pangrattato",
    beer: "Birra",
    salt: "Sale",
    pesto: "Pesto",
    passata: "Passata",
  },
  cs: {
    flour: "Mouka",
    pasta: "Těstoviny",
    breadcrumbs: "Strouhanka",
    beer: "Pivo",
    salt: "Sůl",
    pesto: "Pesto",
    passata: "Passata",
  },
  ru: {
    flour: "Мука",
    pasta: "Макароны",
    breadcrumbs: "Панировочные сухари",
    beer: "Пиво",
    salt: "Соль",
    pesto: "Песто",
    passata: "Пассата",
  },
  uk: {
    flour: "Борошно",
    pasta: "Макарони",
    breadcrumbs: "Панірувальні сухарі",
    beer: "Пиво",
    salt: "Сіль",
    pesto: "Песто",
    passata: "Пасата",
  },
  be: {
    flour: "Мука",
    pasta: "Макароны",
    breadcrumbs: "Сухары",
    beer: "Піва",
    salt: "Соль",
    pesto: "Песта",
    passata: "Пасата",
  },
};

/**
 * Shared CATEGORY RULES for all AI proposal builders.
 * Locale-agnostic aisle thinking; examples localized to AI output language.
 */
export function buildCategoryRulesBlock(language: AiOutputLanguage): string {
  const ex = EXAMPLES[language];
  return [
    "CATEGORY RULES (mandatory):",
    "Think in terms of supermarket aisles rather than food taxonomy.",
    "Choose the category based on where shoppers would typically look for the product in a supermarket.",
    "Categories must come from the enum exactly.",
    "Prefer a real aisle over other. other = cannot classify or non-grocery only.",
    "alcohol: beer, wine, vodka, whisky, cider — never drinks.",
    `Example: \"${ex.beer}\" → alcohol.`,
    "bakery: bread, rolls, tortillas, pizza dough, pastry — NOT pasta, flour, breadcrumbs, or yeast.",
    `Example: \"${ex.flour}\" and \"${ex.pasta}\" → pantry (not bakery). \"${ex.breadcrumbs}\" → pantry (near flour), not bakery.`,
    "pantry: flour, rice, pasta, oats, sugar, cocoa, yeast, baking powder, broth/stock cubes, instant noodles, breadcrumbs.",
    "spices: salt, pepper, dried herbs, spice paprika, mixed spices.",
    `Example: \"${ex.salt}\" → spices.`,
    "sauces: pesto, passata, tomato sauce/concentrate, soy sauce, mustard, jar sauces.",
    `Example: \"${ex.pesto}\" / \"${ex.passata}\" → sauces (not vegetables).`,
    "Fresh herbs → vegetables; dried herbs → spices.",
    "Building materials (tiles, screws, profiles) → diy, not household.",
    "Paper goods (toilet paper, paper towels) → household; sugar is never household.",
    "Ambiguous items (e.g. tofu): pick the best aisle guess; prefer consistency over inventing a single objective truth.",
  ].join("\n");
}
