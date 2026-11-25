import {
  SHOPPING_CATEGORIES,
  SHOPPING_CATEGORY_ICONS,
  type ShoppingCategory,
} from "@shared/shopping-categories";

/** The same names as in the app (mobile/lib/i18n/pl.json, "categories"). */
export const AISLE_LABELS: Record<ShoppingCategory, string> = {
  fruit: "Owoce",
  vegetables: "Warzywa",
  dairy: "Nabiał",
  meat: "Mięso",
  fish: "Ryby",
  bakery: "Pieczywo",
  frozen: "Mrożonki",
  drinks: "Napoje",
  alcohol: "Alkohol",
  snacks: "Przekąski",
  pantry: "Spiżarnia",
  spices: "Przyprawy",
  sauces: "Sosy",
  household: "Dom",
  cleaning: "Sprzątanie",
  baby: "Dziecko",
  pets: "Zwierzęta",
  pharmacy: "Apteka",
  cosmetics: "Kosmetyki",
  electronics: "Elektronika",
  office: "Biuro",
  garden: "Ogród",
  diy: "DIY",
  other: "Inne",
};

export const AISLE_ICONS = SHOPPING_CATEGORY_ICONS;
export const AISLES = SHOPPING_CATEGORIES;
export type Aisle = ShoppingCategory;

export const isAisle = (value: string): value is Aisle =>
  (SHOPPING_CATEGORIES as readonly string[]).includes(value);
