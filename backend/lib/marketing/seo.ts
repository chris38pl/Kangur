import type { Metadata } from "next";

import {
  APP_LOCALE_IDS,
  LOCALE_META,
  legalLocale,
  withLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";

export type MarketingPath =
  | "/"
  | "/contact"
  | "/faq"
  | "/privacy"
  | "/terms"
  | "/delete-account";

export const MARKETING_PATHS: readonly MarketingPath[] = [
  "/",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/delete-account",
];

/**
 * Pages whose body exists only in Polish and English. Other locales render the English
 * body with translated navigation, so Google should index the English URL.
 */
const PL_EN_ONLY: ReadonlySet<MarketingPath> = new Set([
  "/faq",
  "/privacy",
  "/terms",
  "/delete-account",
]);

/** Locales that have their own indexable version of `path`. */
export function contentLocales(path: MarketingPath): readonly AppLocale[] {
  return PL_EN_ONLY.has(path) ? (["pl", "en"] as const) : APP_LOCALE_IDS;
}

/** The locale whose URL is canonical for `path` viewed in `locale`. */
export function canonicalLocale(
  locale: AppLocale,
  path: MarketingPath,
): AppLocale {
  return PL_EN_ONLY.has(path) ? legalLocale(locale) : locale;
}

/** hreflang map for `path`, relative to `metadataBase`, plus x-default (English). */
export function hreflangAlternates(path: MarketingPath): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of contentLocales(path)) {
    languages[locale] = withLocale(locale, path);
  }
  languages["x-default"] = withLocale("en", path);
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
    alt: getMessages(locale).meta.homeTitle,
  };
}

/**
 * Full metadata for one marketing page: title, description, canonical, hreflang,
 * Open Graph and X card, all in the page's language.
 */
export function buildMarketingMetadata(input: {
  locale: AppLocale;
  path: MarketingPath;
  title: string;
  description: string;
}): Metadata {
  const { locale, path, title, description } = input;
  const indexed = canonicalLocale(locale, path);
  const canonical = withLocale(indexed, path);
  const image = ogImage(indexed);

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: hreflangAlternates(path),
    },
    openGraph: {
      type: "website",
      siteName: "Kangur",
      url: canonical,
      title,
      description,
      locale: ogLocale(indexed),
      alternateLocale: contentLocales(path)
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
