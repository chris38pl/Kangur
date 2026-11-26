/**
 * Which AI "create" rows become new items on the list.
 *
 * The prompt keeps `name` canonical and puts the variant in `note`, so
 * "mleko 2%, mleko bez laktozy" comes back as two creates named "Mleko".
 * Those are two products, so both go on the list. A row is dropped only when
 * it repeats another one exactly: same name, same amount and same note as an
 * earlier row of the same proposal or as an item already on the list. Nothing
 * of a dropped row is lost, because the identical item stays.
 *
 * Pure: no Prisma and no path aliases, so
 * `node --test --experimental-strip-types` runs the tests directly.
 */

export type ItemText = {
  name: string;
  amount: string | null;
  note: string | null;
};

/** Case, outer spaces and runs of spaces do not make a different product. */
function normalize(value: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Two rows with the same key say exactly the same thing. */
export function repeatKey(row: ItemText): string {
  return JSON.stringify([
    normalize(row.name),
    normalize(row.amount),
    normalize(row.note),
  ]);
}

/**
 * Keeps the creates in their order. The first of several identical rows wins,
 * so its clientId is the one stored.
 *
 * @param itemsOnList items of the list in any status except removed
 */
export function excludeRepeatedCreates<T extends ItemText>(
  creates: readonly T[],
  itemsOnList: readonly ItemText[],
): T[] {
  const taken = new Set(itemsOnList.map(repeatKey));
  const kept: T[] = [];
  for (const create of creates) {
    const key = repeatKey(create);
    if (taken.has(key)) continue;
    taken.add(key);
    kept.push(create);
  }
  return kept;
}
