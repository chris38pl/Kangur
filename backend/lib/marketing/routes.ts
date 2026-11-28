import {
  APP_LOCALE_IDS,
  SITE_DEFAULT_LOCALE,
  withLocale,
  type AppLocale,
} from "@/lib/marketing/locale";

export type MarketingRouteId =
  | "home"
  | "pricing"
  | "safety"
  | "about"
  | "press"
  | "sharedList"
  | "photoList"
  | "recipeList"
  | "aiList"
  | "aisleTool"
  | "tools"
  | "christmasTool"
  | "weekTool"
  | "films"
  | "faq"
  | "contact"
  | "privacy"
  | "terms"
  | "deleteAccount"
  | "invite";

export type MarketingRoute = {
  /** Path without the language prefix, for every language that has its own content. */
  paths: Partial<Record<AppLocale, string>>;
  /**
   * Languages without their own content still render the page: English body, translated
   * navigation, canonical on the English URL. Only for pages the app links to.
   */
  englishFallback?: boolean;
  /**
   * The path reads the same in every language, so a visitor who reached it without a
   * prefix may be sent to their own language (`/terms` opened from the app in German).
   */
  languageNeutral?: boolean;
  /**
   * Opened only from a link in an e-mail, so not for search: `noindex`, no canonical or
   * hreflang, no place in the sitemap, and no page has to link to it.
   */
  noindex?: boolean;
  /** Day the content last changed, feeds sitemap `lastmod`. */
  updatedAt: string;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
};

function inAll(path: string): Partial<Record<AppLocale, string>> {
  return Object.fromEntries(APP_LOCALE_IDS.map((locale) => [locale, path]));
}

function inPolishAndEnglish(path: string): Partial<Record<AppLocale, string>> {
  return { pl: path, en: path };
}

/** Every page of the site. Navigation, hreflang, sitemap and the proxy all read this. */
export const ROUTES: Record<MarketingRouteId, MarketingRoute> = {
  home: {
    paths: inAll("/"),
    languageNeutral: true,
    updatedAt: "2026-11-25",
    changeFrequency: "weekly",
    priority: 1,
  },
  pricing: {
    paths: { pl: "/cennik", en: "/pricing" },
    updatedAt: "2026-11-25",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  safety: {
    paths: { pl: "/bezpieczenstwo", en: "/safety" },
    updatedAt: "2026-11-25",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  about: {
    paths: { pl: "/o-kangurze", en: "/about" },
    updatedAt: "2026-11-25",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  press: {
    paths: { pl: "/dla-mediow" },
    updatedAt: "2026-11-25",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  sharedList: {
    paths: { pl: "/wspolna-lista-zakupow" },
    updatedAt: "2026-11-25",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  photoList: {
    paths: { pl: "/lista-zakupow-ze-zdjecia" },
    updatedAt: "2026-11-25",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  recipeList: {
    paths: { pl: "/lista-zakupow-z-przepisu" },
    updatedAt: "2026-11-25",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  aiList: {
    paths: { pl: "/lista-zakupow-ai" },
    updatedAt: "2026-11-25",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  aisleTool: {
    paths: { pl: "/lista-zakupow-z-podzialem-na-kategorie" },
    updatedAt: "2026-11-25",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  tools: {
    paths: { pl: "/narzedzia" },
    updatedAt: "2026-11-25",
    changeFrequency: "weekly",
    priority: 0.6,
  },
  christmasTool: {
    paths: { pl: "/lista-zakupow-na-wigilie-i-swieta" },
    updatedAt: "2026-11-25",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  weekTool: {
    paths: { pl: "/lista-zakupow-na-tydzien" },
    updatedAt: "2026-11-25",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  films: {
    paths: { pl: "/filmy" },
    updatedAt: "2026-11-26",
    changeFrequency: "weekly",
    priority: 0.6,
  },
  faq: {
    paths: inPolishAndEnglish("/faq"),
    englishFallback: true,
    languageNeutral: true,
    updatedAt: "2026-11-25",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  contact: {
    paths: inAll("/contact"),
    languageNeutral: true,
    updatedAt: "2026-11-25",
    changeFrequency: "yearly",
    priority: 0.4,
  },
  privacy: {
    paths: inPolishAndEnglish("/privacy"),
    englishFallback: true,
    languageNeutral: true,
    updatedAt: "2026-11-28",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  terms: {
    paths: inPolishAndEnglish("/terms"),
    englishFallback: true,
    languageNeutral: true,
    updatedAt: "2026-11-25",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  deleteAccount: {
    paths: inAll("/delete-account"),
    languageNeutral: true,
    updatedAt: "2026-11-25",
    changeFrequency: "yearly",
    priority: 0.2,
  },
  /** Where the invitation e-mail leads. The token stays in the browser: lib/marketing/invite.ts. */
  invite: {
    paths: inAll("/invite"),
    languageNeutral: true,
    noindex: true,
    updatedAt: "2026-11-26",
    changeFrequency: "yearly",
    priority: 0.1,
  },
};

export const ROUTE_IDS = Object.keys(ROUTES) as MarketingRouteId[];

/** Old or guessed addresses and the page they mean. Permanent, in every language. */
export const PATH_ALIASES: Record<string, MarketingRouteId> = {
  "/support": "contact",
  "/cena": "pricing",
  "/premium": "pricing",
  "/press": "press",
  "/media": "press",
  "/security": "safety",
  "/kontakt": "contact",
  "/pomoc": "faq",
  "/regulamin": "terms",
  "/polityka-prywatnosci": "privacy",
  "/usun-konto": "deleteAccount",
  "/lista-zakupow": "sharedList",
  "/wspolna-lista": "sharedList",
  "/lista-zakupow-ze-screena": "photoList",
  "/lista-zakupow-ze-zrzutu": "photoList",
  "/lista-z-przepisu": "recipeList",
  "/alejki": "aisleTool",
  "/blog": "tools",
  "/poradniki": "tools",
  "/poradniki/lista-zakupow-na-wigilie-i-swieta": "christmasTool",
  "/poradniki/lista-zakupow-na-tydzien": "weekTool",
  "/poradniki/lista-zakupow-do-druku": "tools",
  "/kalkulator": "tools",
  "/wigilia": "christmasTool",
  "/swieta": "christmasTool",
  "/lista-zakupow-na-wigilie": "christmasTool",
  "/lista-zakupow-na-swieta": "christmasTool",
  "/tydzien": "weekTool",
  "/wideo": "films",
  "/filmiki": "films",
};

/** A page for search engines: canonical, hreflang and a place in the sitemap. */
export function isIndexed(id: MarketingRouteId): boolean {
  return !ROUTES[id].noindex;
}

/** Languages that have their own version of the page. */
export function contentLocales(id: MarketingRouteId): readonly AppLocale[] {
  return APP_LOCALE_IDS.filter((locale) => ROUTES[id].paths[locale]);
}

/**
 * Path (no prefix) of the page as rendered in `locale`, or null when the page does not
 * exist in that language at all.
 */
export function routePath(
  id: MarketingRouteId,
  locale: AppLocale,
): string | null {
  const route = ROUTES[id];
  const own = route.paths[locale];
  if (own) return own;
  return route.englishFallback ? (route.paths.en ?? null) : null;
}

/** The language whose URL is canonical for the page viewed in `locale`. */
export function canonicalLocale(
  id: MarketingRouteId,
  locale: AppLocale,
): AppLocale {
  const { paths } = ROUTES[id];
  if (paths[locale]) return locale;
  return paths.en ? "en" : SITE_DEFAULT_LOCALE;
}

/** Public path of a page that is known to exist in `locale`. */
export function routeHref(id: MarketingRouteId, locale: AppLocale): string {
  const path = routePath(id, locale);
  if (!path) throw new Error(`Route "${id}" does not exist in "${locale}"`);
  return withLocale(locale, path);
}

/**
 * Where a link to this page should lead for a reader of `locale`: their language, or the
 * English page, or the Polish one. `hrefLang` is set when the language changes.
 */
export function bestHref(
  id: MarketingRouteId,
  locale: AppLocale,
): { href: string; hrefLang?: AppLocale } {
  if (routePath(id, locale)) return { href: routeHref(id, locale) };
  const other = canonicalLocale(id, locale);
  return { href: routeHref(id, other), hrefLang: other };
}

/** The same page in another language, for the switcher; that language's home if missing. */
export function alternateHref(
  id: MarketingRouteId | null,
  locale: AppLocale,
): string {
  if (id && routePath(id, locale)) return routeHref(id, locale);
  return withLocale(locale, "/");
}

/** The page that uses this path (without prefix), with the languages it belongs to. */
export function findRouteByPath(
  path: string,
): { id: MarketingRouteId; locales: readonly AppLocale[] } | null {
  for (const id of ROUTE_IDS) {
    const locales = contentLocales(id).filter(
      (locale) => ROUTES[id].paths[locale] === path,
    );
    if (locales.length > 0) return { id, locales };
  }
  return null;
}
