import type { Metadata } from "next";

import { LOCALE_META, type AppLocale } from "@/lib/marketing/locale";
import { pageMeta } from "@/lib/marketing/page-meta";
import {
  ROUTES,
  canonicalLocale,
  contentLocales,
  routeHref,
  type MarketingRouteId,
} from "@/lib/marketing/routes";

/**
 * hreflang map for a page, relative to `metadataBase`. `x-default` (a reader whose
 * language we do not have) is English when the page exists in English. A page in one
 * language has no alternates to announce.
 */
export function hreflangAlternates(
  id: MarketingRouteId,
): Record<string, string> | undefined {
  const locales = contentLocales(id);
  if (locales.length < 2) return undefined;

  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = routeHref(id, locale);
  }
  if (ROUTES[id].paths.en) languages["x-default"] = routeHref(id, "en");
  return languages;
}

/** Open Graph wants `pl_PL`, not `pl-PL`. */
export function ogLocale(locale: AppLocale): string {
  return LOCALE_META[locale].bcp47.replace("-", "_");
}

/** Link-preview image for a locale: 1200x630, real app screen. Source: `.marketing/app-store/og`. */
export function ogImage(locale: AppLocale) {
  return {
    url: `/og/${locale}.jpg`,
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: pageMeta("home", locale).title,
  };
}

/**
 * Full metadata for one marketing page: title, description, canonical, hreflang,
 * Open Graph and X card, all in the page's language.
 */
export function buildMarketingMetadata(
  id: MarketingRouteId,
  locale: AppLocale,
): Metadata {
  const { title, description } = pageMeta(id, locale);
  const indexed = canonicalLocale(id, locale);
  const canonical = routeHref(id, indexed);
  const image = ogImage(indexed);

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: hreflangAlternates(id),
    },
    openGraph: {
      type: "website",
      siteName: "Kangur",
      url: canonical,
      title,
      description,
      locale: ogLocale(indexed),
      alternateLocale: contentLocales(id)
        .filter((other) => other !== indexed)
        .map(ogLocale),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}
