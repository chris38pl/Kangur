import type { MetadataRoute } from "next";

import { IS_PRODUCTION_SITE, SITE_URL } from "@/lib/marketing/site";

/**
 * Staging and previews are not disallowed on purpose: a crawler has to open a page to see
 * its `noindex` (next.config.ts). They only advertise no sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const rules = {
    userAgent: "*",
    allow: "/",
    disallow: ["/api/"],
  };
  if (!IS_PRODUCTION_SITE) return { rules };
  return {
    rules,
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
