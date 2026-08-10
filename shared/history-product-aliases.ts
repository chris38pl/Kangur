/**
 * Curated grocery aliases for history-merge identity.
 * Alias only when the difference is clearly linguistic, not semantic.
 * Expand from real user data — prefer false negative over false positive.
 */

/** Groups of aliases → one canonical lemma (after normalize + stem lookup keys). */
export const HISTORY_PRODUCT_ALIAS_GROUPS: readonly (readonly string[])[] = [
  ["pomidor", "pomidory", "pomidorki", "pomidorek"],
  ["ziemniak", "ziemniaki", "kartofel", "kartofle"],
  ["piwo", "piwko"],
] as const;

function buildAliasMap(
  groups: readonly (readonly string[])[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const group of groups) {
    const canonical = group[0];
    if (!canonical) continue;
    for (const alias of group) {
      map.set(alias, canonical);
    }
  }
  return map;
}

/** alias (normalized or stemmed form) → canonical */
export const HISTORY_PRODUCT_ALIAS_MAP: ReadonlyMap<string, string> =
  buildAliasMap(HISTORY_PRODUCT_ALIAS_GROUPS);
