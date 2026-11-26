/** The one host that search engines may index. Everything else is a copy of it. */
export const PRODUCTION_HOST = "www.getkangur.com";

/**
 * Canonical origin of the marketing site.
 *
 * Vercel serves www.getkangur.com and 308-redirects the apex there. Every absolute URL we
 * hand to crawlers (og:image, canonical, hreflang, sitemap) must therefore use www: link
 * previews in Messenger or WhatsApp may not follow a redirect for the image.
 */
export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

/** False on staging, previews and localhost, which must stay out of search results. */
export const IS_PRODUCTION_SITE = isProductionOrigin(SITE_URL);

export function resolveSiteUrl(raw: string | undefined): string {
  const value = raw?.trim().replace(/\/+$/, "");
  if (!value) return "http://localhost:3000";
  try {
    const url = new URL(value);
    if (url.hostname === "getkangur.com") url.hostname = PRODUCTION_HOST;
    return url.origin;
  } catch {
    return value;
  }
}

export function isProductionOrigin(origin: string): boolean {
  try {
    return new URL(origin).hostname === PRODUCTION_HOST;
  } catch {
    return false;
  }
}

/** Absolute URL, written the way Next prints canonicals: the home page has no slash. */
export function absoluteUrl(path: string): string {
  if (path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Apple ID of the App Store listing (EAS `submit.ios.ascAppId`). Live in all countries since 2026-11-10. */
export const APP_STORE_ID = "6832296080";

/**
 * Base of the App Store link, in the form App Store Connect campaign links use.
 * Apple redirects it to the visitor's own storefront; StoreButtons adds pt/ct/mt.
 */
export const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() ||
  `https://apps.apple.com/app/apple-store/id${APP_STORE_ID}`;

export const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() ||
  "https://play.google.com/store/apps/details?id=app.kangur";
