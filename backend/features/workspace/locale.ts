import {
  localeMeta,
  resolveAppLocale,
  type AppLocale,
} from "@/lib/locale";

/** Workspace settings language = app locale (SSOT). */
export function settingsLanguageFromUserLocale(
  locale: string | null | undefined,
): AppLocale {
  return resolveAppLocale(locale);
}

export function defaultHomeName(language: AppLocale): string {
  return localeMeta(language).defaultHomeName;
}
