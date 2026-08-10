import { HISTORY_PRODUCT_ALIAS_MAP } from "./history-product-aliases";

/** Strip diacritics / punct; collapse spaces. */
export function normalizeProductKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Existing PL stemming lite (from history enrich).
 * Do not extend aggressively — false merges are worse than duplicates.
 */
export function stemProductKey(key: string): string {
  if (key.length < 4) return key;
  const stemmed = key.replace(
    /(eczki|uszki|kami|ach|ami|owie|ów|ow|om|ki|ka|y|i)$/u,
    "",
  );
  return stemmed.length >= 3 ? stemmed : key;
}

/**
 * Identity key for history-merge clustering.
 * Pipeline: normalize → stem → curated alias (linguistic only).
 * No fuzzy, containment, or automatic diminutives.
 */
export function toProductIdentityKey(rawName: string): string {
  const normalized = normalizeProductKey(rawName);
  if (!normalized) return "";

  const stemmed = stemProductKey(normalized);

  const fromStem = HISTORY_PRODUCT_ALIAS_MAP.get(stemmed);
  if (fromStem) return fromStem;

  const fromNorm = HISTORY_PRODUCT_ALIAS_MAP.get(normalized);
  if (fromNorm) return fromNorm;

  return stemmed;
}
