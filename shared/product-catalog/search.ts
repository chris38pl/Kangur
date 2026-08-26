import type { AppLocale } from "../locales";
import { normalizeCatalogText, tokenizeCatalogText } from "./normalize";
import { CATALOG_PRODUCTS } from "./products";
import type { CatalogProduct, CatalogSearchHit } from "./types";
import { resolveCatalogLabel } from "./labels";

const RANK = {
  exact: 1,
  prefix_label: 2,
  prefix_alias: 3,
  token_prefix: 4,
  contains: 5,
} as const;

function aliasesForLocale(
  product: CatalogProduct,
  locale: AppLocale,
): string[] {
  return (product.aliases?.[locale] ?? []).map(normalizeCatalogText);
}

function scoreProduct(
  product: CatalogProduct,
  query: string,
  locale: AppLocale,
): CatalogSearchHit | null {
  const label = normalizeCatalogText(resolveCatalogLabel(product, locale));
  const aliases = aliasesForLocale(product, locale);

  if (label === query || aliases.includes(query)) {
    return { product, rank: RANK.exact, matchedVia: "exact" };
  }
  if (label.startsWith(query)) {
    return { product, rank: RANK.prefix_label, matchedVia: "prefix_label" };
  }
  if (aliases.some((a) => a.startsWith(query))) {
    return { product, rank: RANK.prefix_alias, matchedVia: "prefix_alias" };
  }

  const labelTokens = tokenizeCatalogText(label);
  if (labelTokens.some((tok) => tok.startsWith(query))) {
    return { product, rank: RANK.token_prefix, matchedVia: "token_prefix" };
  }
  if (aliases.some((a) => tokenizeCatalogText(a).some((tok) => tok.startsWith(query)))) {
    return { product, rank: RANK.token_prefix, matchedVia: "token_prefix" };
  }

  if (label.includes(query) || aliases.some((a) => a.includes(query))) {
    return { product, rank: RANK.contains, matchedVia: "contains" };
  }

  return null;
}

/**
 * Autocomplete search (permissive). Max 6 by default.
 * Ranking: exact > prefix label > prefix alias > token-prefix > contains.
 */
export function searchCatalogProducts(
  queryRaw: string,
  locale: AppLocale,
  limit = 6,
  products: readonly CatalogProduct[] = CATALOG_PRODUCTS,
): CatalogSearchHit[] {
  const query = normalizeCatalogText(queryRaw);
  if (query.length < 2) return [];

  const hits: CatalogSearchHit[] = [];
  for (const product of products) {
    const hit = scoreProduct(product, query, locale);
    if (hit) hits.push(hit);
  }

  hits.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    const aLabel = resolveCatalogLabel(a.product, locale);
    const bLabel = resolveCatalogLabel(b.product, locale);
    return aLabel.length - bLabel.length || aLabel.localeCompare(bLabel);
  });

  return hits.slice(0, Math.max(0, limit));
}
