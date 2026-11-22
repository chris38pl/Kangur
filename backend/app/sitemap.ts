import type { MetadataRoute } from "next";

import { withLocale } from "@/lib/marketing/locale";
import {
  MARKETING_PATHS,
  contentLocales,
  hreflangAlternates,
} from "@/lib/marketing/seo";
import { CONTENT_UPDATED_AT, absoluteUrl } from "@/lib/marketing/site";

/**
 * Only final, indexable URLs: no locale-less redirects, and pages that exist only in
 * pl + en are listed only in those two languages (other locales canonicalise to en).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of MARKETING_PATHS) {
    const languages = Object.fromEntries(
      Object.entries(hreflangAlternates(path)).map(([lang, href]) => [
        lang,
        absoluteUrl(href),
      ]),
    );

    for (const locale of contentLocales(path)) {
      entries.push({
        url: absoluteUrl(withLocale(locale, path)),
        lastModified: CONTENT_UPDATED_AT,
        changeFrequency: path === "/" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : 0.6,
        alternates: { languages },
      });
    }
  }

  return entries;
}
