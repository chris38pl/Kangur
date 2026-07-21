export const SHOPPING_CATEGORIES = [
  "fruit",
  "vegetables",
  "dairy",
  "meat",
  "fish",
  "bakery",
  "frozen",
  "drinks",
  "alcohol",
  "snacks",
  "household",
  "cleaning",
  "baby",
  "pets",
  "pharmacy",
  "cosmetics",
  "electronics",
  "office",
  "garden",
  "diy",
  "other",
] as const;

export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number];

export function isShoppingCategory(value: string): value is ShoppingCategory {
  return SHOPPING_CATEGORIES.includes(value as ShoppingCategory);
}

/**
 * Store Flow SSOT - default aisle order for Shopping Mode home.
 * Future store presets must go through this helper (never hardcode order in UI).
 */
export function getShoppingCategoryOrder(): readonly ShoppingCategory[] {
  return SHOPPING_CATEGORIES;
}

/** Category icon allowlist (UI may only use these glyphs). */
export const SHOPPING_CATEGORY_ICONS: Record<ShoppingCategory, string> = {
  fruit: "🍎",
  vegetables: "🥦",
  dairy: "🥛",
  meat: "🥩",
  fish: "🐟",
  bakery: "🍞",
  frozen: "🧊",
  drinks: "🧃",
  alcohol: "🍷",
  snacks: "🍪",
  household: "🏠",
  cleaning: "🧹",
  baby: "🍼",
  pets: "🐾",
  pharmacy: "💊",
  cosmetics: "💄",
  electronics: "🔌",
  office: "📎",
  garden: "🌱",
  diy: "🔧",
  other: "🛒",
};

export function getShoppingCategoryIcon(category: ShoppingCategory): string {
  return SHOPPING_CATEGORY_ICONS[category];
}
