import type { AppLocale } from "@/lib/marketing/locale";

/**
 * Static params for a page that exists only in some languages. Combined with
 * `dynamicParams = false` in the root layout, the other languages are a 404 (the proxy
 * redirects people before they get there).
 */
export function onlyIn(...locales: AppLocale[]) {
  return ({ params }: { params: { locale: string } }) =>
    locales.some((locale) => locale === params.locale) ? [{}] : [];
}
