import type { AppLocale } from "../locales";
import { APP_LOCALE_IDS, DEFAULT_LOCALE } from "../locales";
import { normalizeCatalogText } from "./normalize";
import type { CatalogProduct } from "./types";

/** Build full locale label map; missing locales fall back to `en` then `pl`. */
export function L(
  partial: Partial<Record<AppLocale, string>> & { en: string; pl: string },
): Record<AppLocale, string> {
  const fallback = partial.en || partial.pl;
  const out = {} as Record<AppLocale, string>;
  for (const id of APP_LOCALE_IDS) {
    out[id] = partial[id]?.trim() || fallback;
  }
  return out;
}

export function resolveCatalogLabel(
  product: CatalogProduct,
  locale: AppLocale,
): string {
  return (
    product.labels[locale] ||
    product.labels[DEFAULT_LOCALE] ||
    product.labels.en ||
    product.slug
  );
}

/** Assert every product has non-empty labels for all app locales. */
export function assertCatalogLabelCompleteness(
  products: readonly CatalogProduct[],
): void {
  for (const product of products) {
    for (const id of APP_LOCALE_IDS) {
      const label = product.labels[id]?.trim();
      if (!label) {
        throw new Error(
          `Catalog product "${product.slug}" missing label for locale "${id}"`,
        );
      }
    }
  }
}

/**
 * Assert no two products share a normalized label or alias within one locale.
 * A duplicate makes the second product unreachable for `matchCatalogProduct`,
 * which returns the first array hit.
 */
export function assertCatalogLabelUniqueness(
  products: readonly CatalogProduct[],
): void {
  for (const locale of APP_LOCALE_IDS) {
    const seen = new Map<string, { slug: string; kind: string }>();

    for (const product of products) {
      const entries: { text: string; kind: string }[] = [
        { text: resolveCatalogLabel(product, locale), kind: "label" },
        ...(product.aliases?.[locale] ?? []).map((alias) => ({
          text: alias,
          kind: "alias",
        })),
      ];

      // Own label repeated as own alias is harmless, dedupe within the product.
      const ownSeen = new Set<string>();

      for (const entry of entries) {
        const key = normalizeCatalogText(entry.text);
        if (!key || ownSeen.has(key)) continue;
        ownSeen.add(key);

        const clash = seen.get(key);
        if (clash) {
          throw new Error(
            `Catalog duplicate in locale "${locale}": "${key}" used by ` +
              `${clash.slug} (${clash.kind}) and ${product.slug} (${entry.kind})`,
          );
        }
        seen.set(key, { slug: product.slug, kind: entry.kind });
      }
    }
  }
}
