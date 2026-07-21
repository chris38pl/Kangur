import type { MetadataRoute } from "next";

import { APP_LOCALE_IDS } from "@/lib/marketing/locale";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

const paths = [
  "",
  "/faq",
  "/privacy",
  "/terms",
  "/contact",
  "/delete-account",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of APP_LOCALE_IDS) {
    for (const path of paths) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : 0.6,
      });
    }
  }

  // Stable unprefixed aliases (redirect to locale) - useful for store listings
  for (const path of [
    "/faq",
    "/privacy",
    "/terms",
    "/contact",
    "/delete-account",
  ]) {
    entries.push({
      url: `${siteUrl}${path}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}
