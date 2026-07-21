import { createEnumSchema } from "@/lib/zod-enum";

import {
  APP_LOCALE_IDS,
  DEFAULT_LOCALE,
  LOCALE_META,
  SUPPORTED_LOCALES,
  intlLocaleTag,
  isAppLocale,
  localeMeta,
  resolveAppLocale,
  resolvePreferredLocale,
  type AppLocale,
  type LocaleMeta,
} from "@shared/locales";

export {
  APP_LOCALE_IDS,
  DEFAULT_LOCALE,
  LOCALE_META,
  SUPPORTED_LOCALES,
  intlLocaleTag,
  isAppLocale,
  localeMeta,
  resolveAppLocale,
  resolvePreferredLocale,
  type AppLocale,
  type LocaleMeta,
};

/** Shared Zod schema for AppLocale - use everywhere instead of z.enum casts. */
export const AppLocaleSchema = createEnumSchema(APP_LOCALE_IDS);
