import type { MetadataRoute } from "next";

import { CHRISTMAS } from "@/lib/marketing/lists/christmas";
import { ROUTES, ROUTE_IDS, contentLocales, isIndexed, routeHref } from "@/lib/marketing/routes";
import { isOver } from "@/lib/marketing/season";
import { hreflangAlternates } from "@/lib/marketing/seo";
import { absoluteUrl } from "@/lib/marketing/site";

/**
 * Only final, indexable URLs: no redirects, no `noindex` pages, and a page is listed only
 * in the languages it really exists in (the others canonicalise to English).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTE_IDS.filter(isIndexed).flatMap((id) => {
    const { updatedAt, changeFrequency } = ROUTES[id];
    // Until next November other pages matter more.
    const priority = id === "christmasTool" && isOver(CHRISTMAS.over) ? 0.3 : ROUTES[id].priority;
    const alternates = hreflangAlternates(id);
    const languages = alternates
      ? Object.fromEntries(
          Object.entries(alternates).map(([lang, href]) => [
            lang,
            absoluteUrl(href),
          ]),
        )
      : undefined;

    return contentLocales(id).map((locale) => ({
      url: absoluteUrl(routeHref(id, locale)),
      lastModified: updatedAt,
      changeFrequency,
      priority,
      ...(languages ? { alternates: { languages } } : {}),
    }));
  });
}
