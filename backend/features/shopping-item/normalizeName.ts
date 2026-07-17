/** Trim and collapse internal whitespace. */
export function normalizeShoppingItemName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}
