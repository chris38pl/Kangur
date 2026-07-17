/** Trim and collapse internal whitespace. */
export function normalizeShoppingListName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}
