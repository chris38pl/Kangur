import type { Metadata } from "next";

import { LOCALE_META, type AppLocale } from "@/lib/marketing/locale";
import { OG_IMAGES } from "@/lib/marketing/og.generated";
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

/** Link preview, 1200x630: the top of the page itself, else the one of the home page. */
export function ogImage(id: MarketingRouteId, locale: AppLocale) {
  const own = OG_IMAGES[`${id}/${locale}`];
  return {
    url: own ?? OG_IMAGES[`home/${locale}`],
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: pageMeta(own ? id : "home", locale).title,
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
  const image = ogImage(id, indexed);

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: hreflangAlternates(id),
    },
    openGraph: {
      ...(ROUTES[id].publishedAt
        ? { type: "article" as const, publishedTime: ROUTES[id].publishedAt }
        : { type: "website" as const }),
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
