import { type AppLocale, intlLocaleTag } from "../locales";

/** Generic shopping-list prefix when no themed title is inferred. */
export const SHOPPING_LIST_GENERIC_PREFIX: Record<AppLocale, string> = {
  pl: "Zakupy",
  en: "Shopping",
  de: "Einkauf",
  ru: "Покупки",
  uk: "Покупки",
  fr: "Courses",
  es: "Compra",
  it: "Spesa",
  cs: "Nákup",
  be: "Пакупкі",
};

export const SHOPPING_LIST_TITLE_MAX_LENGTH = 32;

function formatDatePart(
  date: Date,
  localeTag: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(localeTag, options).format(date).trim();
}

/**
 * Default list title: "{Shopping}, {weekday} {day month}" in the user's locale.
 * Day and month are formatted together so each language gets its own grammar
 * and casing, e.g. pl "Zakupy, środa 4 listopada", ru "Покупки, среда 4 ноября",
 * de "Einkauf, Mittwoch 4. November".
 */
export function formatDefaultShoppingListTitle(
  locale: AppLocale,
  date: Date = new Date(),
  maxLength = SHOPPING_LIST_TITLE_MAX_LENGTH,
): string {
  const localeTag = intlLocaleTag(locale);
  const prefix = SHOPPING_LIST_GENERIC_PREFIX[locale];

  const weekdayLong = formatDatePart(date, localeTag, { weekday: "long" });
  const dayMonthLong = formatDatePart(date, localeTag, {
    day: "numeric",
    month: "long",
  });
  let title = `${prefix}, ${weekdayLong} ${dayMonthLong}`;
  if (title.length <= maxLength) return title;

  const weekdayShort = formatDatePart(date, localeTag, { weekday: "short" });
  const dayMonthShort = formatDatePart(date, localeTag, {
    day: "numeric",
    month: "short",
  });
  title = `${prefix}, ${weekdayShort} ${dayMonthShort}`;
  if (title.length <= maxLength) return title;

  title = `${prefix}, ${dayMonthShort}`;
  if (title.length <= maxLength) return title;

  return title.slice(0, maxLength).trimEnd() || prefix.slice(0, maxLength);
}

export function isGenericShoppingListTitle(
  title: string,
  locale: AppLocale,
): boolean {
  const normalized = title.trim().toLocaleLowerCase(intlLocaleTag(locale));
  const prefix = SHOPPING_LIST_GENERIC_PREFIX[locale].toLocaleLowerCase(
    intlLocaleTag(locale),
  );
  return normalized === prefix;
}

/** Use dated default when title is empty or only the generic shopping prefix. */
export function resolveShoppingListTitle(
  title: string | null | undefined,
  locale: AppLocale,
  date: Date = new Date(),
  maxLength = SHOPPING_LIST_TITLE_MAX_LENGTH,
): string {
  const trimmed = title?.trim() ?? "";
  if (!trimmed || isGenericShoppingListTitle(trimmed, locale)) {
    return formatDefaultShoppingListTitle(locale, date, maxLength);
  }
  const clipped = trimmed.slice(0, maxLength).trimEnd();
  return clipped || formatDefaultShoppingListTitle(locale, date, maxLength);
}
