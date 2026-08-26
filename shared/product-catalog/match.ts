import type { AppLocale } from "../locales";
import { normalizeCatalogText } from "./normalize";
import { CATALOG_PRODUCTS } from "./products";
import type { CatalogProduct } from "./types";
import { resolveCatalogLabel } from "./labels";

/**
 * Strict AI / post-match: exact label or exact equivalent alias only.
 * No containment (catalog ⊂ aiName). No closely-related aliases.
 */
export function matchCatalogProduct(
  nameRaw: string,
  locale: AppLocale,
  products: readonly CatalogProduct[] = CATALOG_PRODUCTS,
): CatalogProduct | null {
  const name = normalizeCatalogText(nameRaw);
  if (!name) return null;

  for (const product of products) {
    const label = normalizeCatalogText(resolveCatalogLabel(product, locale));
    if (label === name) return product;

    const aliases = product.aliases?.[locale] ?? [];
    for (const alias of aliases) {
      if (normalizeCatalogText(alias) === name) return product;
    }
  }

  // Also try other locales' exact labels/aliases so "kartoffeln" still maps
  // when AI output locale mismatches slightly — still exact only.
  for (const product of products) {
    for (const label of Object.values(product.labels)) {
      if (normalizeCatalogText(label) === name) return product;
    }
    if (!product.aliases) continue;
    for (const list of Object.values(product.aliases)) {
      if (!list) continue;
      for (const alias of list) {
        if (normalizeCatalogText(alias) === name) return product;
      }
    }
  }

  return null;
}
