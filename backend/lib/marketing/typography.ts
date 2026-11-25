import type { AppLocale } from "@/lib/marketing/locale";

/**
 * Typesetting. In Slavic languages a line must not end with a one-letter word ("i", "w",
 * "z"), French puts a space before its high punctuation, and a number stays with its unit.
 * Screens are narrow and text reflows, so it has to live in the text itself.
 */
const NBSP = "\u00a0";
/** Narrow, the French kind. */
const NNBSP = "\u202f";

/** One-letter words that may not be left alone at the end of a line. */
const ONE_LETTER_WORDS: Partial<Record<AppLocale, string>> = {
  pl: "aiouwz",
  cs: "kvszouai",
  ru: "авикосуя",
  uk: "авзійоуя",
  be: "азійоуўя",
};

/** No lookbehind: this also runs in browsers, and Safari before 16.4 cannot parse one. */
const ONE_LETTER = Object.fromEntries(
  Object.entries(ONE_LETTER_WORDS).map(([locale, letters]) => [
    locale,
    new RegExp(
      `(^|[\\s(„«"[|])([${letters}${letters.toLocaleUpperCase(locale)}]) (?=\\S)`,
      "gu",
    ),
  ]),
) as Partial<Record<AppLocale, RegExp>>;

const WITH_UNIT =
  /(\d) (?=(?:zł|kg|g|dag|l|ml|szt\.|%|MB|KB|r\.)(?![\p{L}\p{N}]))/gu;
/** 10 000 zł */
const THOUSANDS = /(\d) (?=\d{3}(?!\d))/g;

export function typeset(text: string, locale: AppLocale): string {
  let result = text
    .replace(WITH_UNIT, `$1${NBSP}`)
    .replace(THOUSANDS, `$1${NBSP}`);
  const oneLetter = ONE_LETTER[locale];
  if (oneLetter) {
    // Twice, because neighbours ("a i w domu") share the space between them.
    for (let pass = 0; pass < 2; pass += 1) {
      result = result.replace(oneLetter, `$1$2${NBSP}`);
    }
  }
  if (locale === "fr") {
    result = result
      .replace(/ ([?!;])/g, `${NNBSP}$1`)
      .replace(/ (:)(?=\s|$)/g, `${NBSP}$1`)
      .replace(/« /g, `«${NBSP}`)
      .replace(/ »/g, `${NBSP}»`);
  }
  return result;
}

export const typesetPl = (text: string): string => typeset(text, "pl");

/** The same for every string of a page's copy. */
export function typesetCopy<T>(copy: T, locale: AppLocale = "pl"): T {
  if (typeof copy === "string") return typeset(copy, locale) as T;
  if (Array.isArray(copy)) {
    return copy.map((item) => typesetCopy(item, locale)) as T;
  }
  if (copy && typeof copy === "object") {
    return Object.fromEntries(
      Object.entries(copy).map(([key, value]) => [key, typesetCopy(value, locale)]),
    ) as T;
  }
  return copy;
}

/** Back to ordinary spaces, for text that leaves the page. */
export function plainSpaces(text: string): string {
  return text.replace(/[\u00a0\u202f]/g, " ");
}
