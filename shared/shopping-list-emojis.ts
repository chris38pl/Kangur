export const SHOPPING_LIST_EMOJIS = [
  "🛒",
  "🥩",
  "🥦",
  "🍎",
  "🍞",
  "🎉",
  "🏕️",
  "🧺",
  "🐶",
  "🏠",
] as const;

export type ShoppingListEmoji = (typeof SHOPPING_LIST_EMOJIS)[number];

export function isShoppingListEmoji(value: string): value is ShoppingListEmoji {
  return SHOPPING_LIST_EMOJIS.includes(value as ShoppingListEmoji);
}
