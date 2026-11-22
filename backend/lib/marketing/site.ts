/**
 * Canonical origin of the marketing site.
 *
 * Vercel serves www.getkangur.com and 308-redirects the apex there. Every absolute URL we
 * hand to crawlers (og:image, canonical, hreflang, sitemap) must therefore use www: link
 * previews in Messenger or WhatsApp may not follow a redirect for the image.
 */
export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export function resolveSiteUrl(raw: string | undefined): string {
  const value = raw?.trim().replace(/\/+$/, "");
  if (!value) return "http://localhost:3000";
  try {
    const url = new URL(value);
    if (url.hostname === "getkangur.com") url.hostname = "www.getkangur.com";
    return url.origin;
  } catch {
    return value;
  }
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Apple ID of the App Store listing (EAS `submit.ios.ascAppId`). Live in all countries since 2026-11-10. */
export const APP_STORE_ID = "6832296080";

/** Apple redirects this to the visitor's own storefront. */
export const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() ||
  `https://apps.apple.com/app/id${APP_STORE_ID}`;

export const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() ||
  "https://play.google.com/store/apps/details?id=app.kangur";

/** Bump when page content changes; feeds sitemap `lastmod`. */
export const CONTENT_UPDATED_AT = new Date("2026-11-22T00:00:00Z");
