import i18n from "@/lib/i18n";
import {
  resolveAppLocale,
  type AppLocale,
} from "@/lib/i18n/locales";
import { writePreferredLocale } from "@/lib/i18n/preferred-locale-storage";

/**
 * Apply UI language locally (and persist for next cold start).
 * Callers that are signed-in should also sync `/me` locale when needed.
 */
export async function applyAppLocale(locale: AppLocale): Promise<AppLocale> {
  const next = resolveAppLocale(locale);
  await writePreferredLocale(next);
  if (resolveAppLocale(i18n.language) !== next) {
    await i18n.changeLanguage(next);
  }
  return next;
}
