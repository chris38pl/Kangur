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

function capitalizeWord(word: string, localeTag: string): string {
  const trimmed = word.trim();
  if (!trimmed) return trimmed;
  const [first, ...rest] = Array.from(trimmed);
  return (
    first!.toLocaleUpperCase(localeTag) + rest.join("")
  );
}

function formatDatePart(
  date: Date,
  localeTag: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(localeTag, options).format(date);
}

function joinTitle(prefix: string, weekday: string, day: string, month: string): string {
  return `${prefix}, ${weekday} ${day} ${month}`;
}

/**
 * Default list title: "{Shopping}, {Weekday} {day} {Month}" in the user's locale.
 * Example (pl): "Zakupy, Poniedziałek 23 Maj"
 */
export function formatDefaultShoppingListTitle(
  locale: AppLocale,
  date: Date = new Date(),
  maxLength = SHOPPING_LIST_TITLE_MAX_LENGTH,
): string {
  const localeTag = intlLocaleTag(locale);
  const prefix = SHOPPING_LIST_GENERIC_PREFIX[locale];
  const day = formatDatePart(date, localeTag, { day: "numeric" });

  const weekdayLong = capitalizeWord(
    formatDatePart(date, localeTag, { weekday: "long" }),
    localeTag,
  );
  const monthLong = capitalizeWord(
    formatDatePart(date, localeTag, { month: "long" }),
    localeTag,
  );

  let title = joinTitle(prefix, weekdayLong, day, monthLong);
  if (title.length <= maxLength) return title;

  const weekdayShort = capitalizeWord(
    formatDatePart(date, localeTag, { weekday: "short" }),
    localeTag,
  );
  const monthShort = capitalizeWord(
    formatDatePart(date, localeTag, { month: "short" }),
    localeTag,
  );

  title = joinTitle(prefix, weekdayShort, day, monthShort);
  if (title.length <= maxLength) return title;

  title = `${prefix}, ${day} ${monthShort}`;
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
