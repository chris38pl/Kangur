import { toProductIdentityKey } from "@shared/history-product-identity";

/**
 * Drop proposal rows whose product identity is already on the target list.
 * Same key as history merge (normalize, stem, curated alias), so
 * "Pomidory" and "pomidor" count as one product.
 */
export function excludeItemsAlreadyOnList<T extends { name: string }>(
  items: T[],
  existingNames: readonly string[],
): T[] {
  const existing = new Set<string>();
  for (const name of existingNames) {
    const key = toProductIdentityKey(name);
    if (key) existing.add(key);
  }
  if (existing.size === 0) return items;

  return items.filter((item) => {
    const key = toProductIdentityKey(item.name);
    return !key || !existing.has(key);
  });
}
