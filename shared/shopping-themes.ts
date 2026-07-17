export const SHOPPING_LIST_THEMES = [
  "generic",
  "grill",
  "weekend",
  "party",
  "breakfast",
  "pet",
  "baby",
  "bathroom",
  "household",
  "garden",
  "vegetables",
  "travel",
  "mealprep",
  "seasonal",
] as const;

export type ShoppingListTheme = (typeof SHOPPING_LIST_THEMES)[number];

export function isShoppingListTheme(value: string): value is ShoppingListTheme {
  return SHOPPING_LIST_THEMES.includes(value as ShoppingListTheme);
}
