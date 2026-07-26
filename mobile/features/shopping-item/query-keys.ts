/**
 * React Query keys for shopping-items.
 * Live queries and setQueryData writers must use the same 3-segment key.
 */

export type ShoppingItemsScope = "active" | "archived";

/** Exact key observed by {@link useShoppingItems}. */
export function shoppingItemsQueryKey(
  listId: string,
  scope: ShoppingItemsScope = "active",
) {
  return ["shopping-items", listId, scope] as const;
}

/** Prefix for invalidate / remove across active + archived scopes. */
export function shoppingItemsQueryPrefix(listId: string) {
  return ["shopping-items", listId] as const;
}
