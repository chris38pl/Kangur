import type { AppLocale } from "@/lib/marketing/locale";

/**
 * Static params for a page that exists only in some languages. Combined with
 * `dynamicParams = false` in the root layout, the other languages are a 404 (the proxy
 * redirects people before they get there).
 *
 * The languages are named here, not filtered from the parent's: an empty list means "take
 * the parent's params as they are" to Next, so `[]` would build the page in all ten.
 */
export function onlyIn(...locales: AppLocale[]) {
  return () => locales.map((locale) => ({ locale }));
}
