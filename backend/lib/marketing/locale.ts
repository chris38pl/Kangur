import {
  APP_LOCALE_IDS,
  DEFAULT_LOCALE,
  isAppLocale,
  resolvePreferredLocale,
  type AppLocale,
} from "@shared/locales";

export {
  APP_LOCALE_IDS,
  DEFAULT_LOCALE,
  isAppLocale,
  LOCALE_META,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@shared/locales";

/** Cookie remembering marketing UI language. */
export const MARKETING_LOCALE_COOKIE = "kangur_locale";

/**
 * Privacy & Terms exist only in PL + EN.
 * All other UI locales fall back to English legal copy.
 */
export type LegalLocale = "pl" | "en";

export function legalLocale(locale: AppLocale): LegalLocale {
  return locale === "pl" ? "pl" : "en";
}

/**
 * Language for a locale-less URL (e.g. a bare getkangur.com link) when the visitor gives
 * no usable signal. Link-preview bots (Messenger, WhatsApp, iMessage...) send no
 * Accept-Language, or their own server's, never the sharer's. Kangur's main market is
 * Poland, so those previews are Polish.
 */
export const MARKETING_FALLBACK_LOCALE: AppLocale = "pl";

const LINK_PREVIEW_BOT =
  /facebookexternalhit|facebookcatalog|facebot|meta-externalagent|whatsapp|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|skypeuripreview|viber|snapchat|pinterest|redditbot|vkshare|iframely|embedly/i;

export function isLinkPreviewBot(userAgent: string | null | undefined): boolean {
  return Boolean(userAgent && LINK_PREVIEW_BOT.test(userAgent));
}

export function resolveMarketingLocale(input: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
  userAgent?: string | null;
}): AppLocale {
  if (isAppLocale(input.cookieLocale)) return input.cookieLocale;
  if (isLinkPreviewBot(input.userAgent) || !input.acceptLanguage?.trim()) {
    return MARKETING_FALLBACK_LOCALE;
  }
  return resolvePreferredLocale({
    acceptLanguage: input.acceptLanguage,
    defaultLocale: DEFAULT_LOCALE,
  });
}

/** Strip leading `/{locale}` from a pathname (or return as-is). */
export function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split("/");
  const maybe = parts[1];
  if (maybe && isAppLocale(maybe)) {
    const rest = parts.slice(2).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}

export function withLocale(locale: AppLocale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

export function isMarketingStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/health") ||
    pathname.startsWith("/metrics") ||
    pathname.startsWith("/openapi") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/site.webmanifest" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

export const MARKETING_LOCALES = APP_LOCALE_IDS;
