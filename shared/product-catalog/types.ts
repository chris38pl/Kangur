import type { AppLocale } from "../locales";
import type { ShoppingCategory } from "../shopping-categories";

/**
 * Catalog entry identity is `slug` only (internal SSOT key).
 * ShoppingItem does not store catalogSlug in v1.
 */
export type CatalogProduct = {
  slug: string;
  category: ShoppingCategory;
  labels: Record<AppLocale, string>;
  /** Semantically equivalent synonyms only (kartofle → potatoes), never variants. */
  aliases?: Partial<Record<AppLocale, string[]>>;
};

export type CatalogSearchHit = {
  product: CatalogProduct;
  rank: number;
  matchedVia: "exact" | "prefix_label" | "prefix_alias" | "token_prefix" | "contains";
};
