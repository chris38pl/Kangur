import {
  localeMeta,
  resolveAppLocale,
  type AppLocale,
} from "@/lib/locale";

/** Workspace settings language = app locale (SSOT).
 * Unknown/null → DEFAULT_LOCALE (en). Prefer an explicit AppLocale at call sites
 * that create default "Home" workspaces — see ensureDefaultWorkspace fail-closed. */
export function settingsLanguageFromUserLocale(
  locale: string | null | undefined,
): AppLocale {
  return resolveAppLocale(locale);
}

export function defaultHomeName(language: AppLocale): string {
  return localeMeta(language).defaultHomeName;
}
