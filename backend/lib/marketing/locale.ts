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

/** Cookie remembering the language a visitor picked in the switcher. */
export const MARKETING_LOCALE_COOKIE = "kangur_locale";

/**
 * Language served at URLs without a prefix (`/`, `/faq`). Kangur's main market is Poland,
 * and these are the URLs Google already knows, so they answer with Polish content
 * themselves instead of redirecting somewhere that depends on the visitor.
 */
export const SITE_DEFAULT_LOCALE: AppLocale = "pl";

/**
 * Privacy & Terms exist only in PL + EN.
 * All other UI locales fall back to English legal copy.
 */
export type LegalLocale = "pl" | "en";

export function legalLocale(locale: AppLocale): LegalLocale {
  return locale === "pl" ? "pl" : "en";
}

/**
 * Crawlers get the language of the URL, never a guess. Search engines usually send no
 * Accept-Language at all, and link-preview bots (Messenger, WhatsApp, iMessage...) send
 * their own server's, never the sharer's. Other languages have their own URLs, hreflang
 * and links, so nothing is hidden from bots.
 */
const CRAWLER = new RegExp(
  [
    // Search and AI search
    "googlebot",
    "google-inspectiontool",
    "googleother",
    "adsbot-google",
    "mediapartners-google",
    "bingbot",
    "bingpreview",
    "duckduckbot",
    "applebot",
    "yandex",
    "seznambot",
    "baiduspider",
    "petalbot",
    "qwantbot",
    "gptbot",
    "oai-searchbot",
    "chatgpt-user",
    "claudebot",
    "claude-user",
    "claude-searchbot",
    "perplexity",
    "ccbot",
    "amazonbot",
    // Link previews
    "facebookexternalhit",
    "facebookcatalog",
    "facebot",
    "meta-externalagent",
    "whatsapp",
    "twitterbot",
    "linkedinbot",
    "slackbot",
    "telegrambot",
    "discordbot",
    "skypeuripreview",
    "viber",
    "snapchat",
    "pinterest",
    "redditbot",
    "vkshare",
    "iframely",
    "embedly",
  ].join("|"),
  "i",
);

export function isCrawler(userAgent: string | null | undefined): boolean {
  return Boolean(userAgent && CRAWLER.test(userAgent));
}

/**
 * Language for a URL without a prefix: the visitor's own choice, then the browser.
 * Crawlers and clients that state no preference get the site default. A browser that
 * lists only languages we do not have gets English.
 */
export function resolveMarketingLocale(input: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
  userAgent?: string | null;
}): AppLocale {
  if (isCrawler(input.userAgent)) return SITE_DEFAULT_LOCALE;
  if (isAppLocale(input.cookieLocale)) return input.cookieLocale;
  const accepted = input.acceptLanguage?.trim();
  if (!accepted) return SITE_DEFAULT_LOCALE;

  // Scripts and some bots send only "*": any language will do, so the site default does.
  const acceptsAny = accepted
    .split(",")
    .some((part) => part.trim().startsWith("*"));
  return resolvePreferredLocale({
    acceptLanguage: accepted,
    defaultLocale: acceptsAny ? SITE_DEFAULT_LOCALE : DEFAULT_LOCALE,
  });
}

/** Split `/en/faq` into `en` + `/faq`; `/faq` has no prefix. */
export function splitLocalePrefix(pathname: string): {
  prefix: AppLocale | null;
  path: string;
} {
  const parts = pathname.split("/");
  const maybe = parts[1];
  if (maybe && isAppLocale(maybe)) {
    const rest = parts.slice(2).join("/");
    return { prefix: maybe, path: rest ? `/${rest}` : "/" };
  }
  return { prefix: null, path: pathname || "/" };
}

/** Pathname without the language prefix, the same for `/faq` and its source `/pl/faq`. */
export function stripLocalePrefix(pathname: string): string {
  return splitLocalePrefix(pathname).path;
}

/** Public path of a page: no prefix in Polish, `/{locale}/...` everywhere else. */
export function withLocale(locale: AppLocale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === SITE_DEFAULT_LOCALE) return normalized;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

/** Path of the same page inside `app/[locale]`, where every language has a segment. */
export function internalPath(locale: AppLocale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
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
