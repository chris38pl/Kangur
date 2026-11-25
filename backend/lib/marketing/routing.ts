import {
  SITE_DEFAULT_LOCALE,
  internalPath,
  resolveMarketingLocale,
  splitLocalePrefix,
  withLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import {
  PATH_ALIASES,
  ROUTES,
  bestHref,
  findRouteByPath,
  routePath,
  type MarketingRouteId,
} from "@/lib/marketing/routes";

export type RoutingDecision =
  | { kind: "next" }
  /** Serve another path of `app/`, the address in the browser stays. */
  | { kind: "rewrite"; path: string }
  /** 308: the address is wrong for everyone. 307: right, but not for this visitor. */
  | { kind: "redirect"; path: string; status: 307 | 308 };

export type RoutingInput = {
  pathname: string;
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
  userAgent?: string | null;
  /** The visitor clicked a link on this very site. */
  sameOrigin?: boolean;
};

const permanent = (path: string): RoutingDecision => ({
  kind: "redirect",
  path,
  status: 308,
});

const temporary = (path: string): RoutingDecision => ({
  kind: "redirect",
  path,
  status: 307,
});

const rewrite = (locale: AppLocale, path: string): RoutingDecision => ({
  kind: "rewrite",
  path: internalPath(locale, path),
});

/**
 * Which page answers a marketing URL. Pure, so every case is a test.
 *
 *   /faq            Polish, 200. A visitor from outside whose choice or browser says
 *                   otherwise: 307 to their language
 *   /pl/faq         308 /faq. Served as it is when that redirect would end in another
 *                   language: the address says Polish, so Polish it is
 *   /en/faq         English, 200
 *   /support        308 /contact
 *   /anything-else  404 at that address, in the visitor's language
 */
export function decideMarketingRoute(input: RoutingInput): RoutingDecision {
  const { prefix, path } = splitLocalePrefix(input.pathname);

  const alias = PATH_ALIASES[path];
  if (alias) return permanent(bestHref(alias, prefix ?? SITE_DEFAULT_LOCALE).href);

  const found = findRouteByPath(path);

  if (prefix === SITE_DEFAULT_LOCALE) {
    const plain = decideUnprefixed(path, found, input);
    return plain.kind === "redirect" && plain.status === 307
      ? { kind: "next" }
      : permanent(withLocale(SITE_DEFAULT_LOCALE, path));
  }

  if (prefix) return decidePrefixed(prefix, path, found?.id ?? null);
  return decideUnprefixed(path, found, input);
}

function decideUnprefixed(
  path: string,
  found: ReturnType<typeof findRouteByPath>,
  input: RoutingInput,
): RoutingDecision {
  // A slug that exists only in other languages (`/safety`) can only mean that language.
  if (found && !found.locales.includes(SITE_DEFAULT_LOCALE)) {
    return permanent(withLocale(found.locales[0], path));
  }

  // A link clicked on the site means exactly the page it names. Without this, the switcher
  // could not lead to Polish when cookies are off or the link opens in a new tab.
  const preferred = input.sameOrigin
    ? SITE_DEFAULT_LOCALE
    : resolveMarketingLocale(input);
  if (preferred === SITE_DEFAULT_LOCALE) {
    return rewrite(SITE_DEFAULT_LOCALE, path);
  }

  if (!found) return rewrite(preferred, path);

  // A Polish slug was asked for by name, so Polish is what opens.
  if (!ROUTES[found.id].languageNeutral) {
    return rewrite(SITE_DEFAULT_LOCALE, path);
  }

  const { href } = bestHref(found.id, preferred);
  return href === path ? rewrite(SITE_DEFAULT_LOCALE, path) : temporary(href);
}

/** `/en/...`, `/de/...`: serve it, or send a foreign slug to the page it belongs to. */
function decidePrefixed(
  prefix: AppLocale,
  path: string,
  id: MarketingRouteId | null,
): RoutingDecision {
  if (!id) return { kind: "next" };

  const own = routePath(id, prefix);
  if (own === path) return { kind: "next" };
  if (own) return permanent(withLocale(prefix, own));

  // Not translated into this language yet, so the redirect must not stick.
  return temporary(bestHref(id, prefix).href);
}
