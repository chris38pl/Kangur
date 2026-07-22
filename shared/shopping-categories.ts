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

/**
 * Resolve aisle order for a list: validated override first, then append any
 * missing defaults (new enum values / empty aisles stay defined).
 * Empty/undefined override → full defaults. Future storeLayoutId presets
 * apply only when override is empty; user drag writes an explicit override.
 */
export function resolveShoppingCategoryOrder(
  override?: readonly string[] | null,
): ShoppingCategory[] {
  const seen = new Set<ShoppingCategory>();
  const resolved: ShoppingCategory[] = [];

  if (override) {
    for (const value of override) {
      if (!isShoppingCategory(value) || seen.has(value)) continue;
      seen.add(value);
      resolved.push(value);
    }
  }

  for (const category of SHOPPING_CATEGORIES) {
    if (seen.has(category)) continue;
    seen.add(category);
    resolved.push(category);
  }

  return resolved;
}

/**
 * After the user reorders a subset of aisles (e.g. active in Shopping Mode),
 * splice that permutation into the full resolved order, leaving other aisles
 * in place.
 */
export function mergeActiveCategoryOrder(
  fullOrder: readonly ShoppingCategory[],
  newActiveOrder: readonly ShoppingCategory[],
): ShoppingCategory[] {
  const activeSet = new Set(newActiveOrder);
  let next = 0;
  return fullOrder.map((category) => {
    if (activeSet.has(category)) {
      const replacement = newActiveOrder[next];
      next += 1;
      return replacement ?? category;
    }
    return category;
  });
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
