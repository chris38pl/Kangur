/**
 * Polish typesetting. A line must not end with a one-letter word ("i", "w", "z"), and a
 * number stays with its unit. Screens are narrow and text reflows, so it has to live in
 * the text itself.
 */
const NBSP = " ";
const ONE_LETTER = /(?<=^|[\s(„"[|])([aiouwzAIOUWZ]) (?=\S)/g;
const WITH_UNIT = /(\d) (?=(?:zł|kg|g|dag|l|ml|szt\.|%|MB|KB|r\.)(?![\p{L}\p{N}]))/gu;

export function typesetPl(text: string): string {
  return text
    .replace(ONE_LETTER, `$1${NBSP}`)
    .replace(WITH_UNIT, `$1${NBSP}`);
}

/** The same for every string of a page's copy. */
export function typesetCopy<T>(copy: T): T {
  if (typeof copy === "string") return typesetPl(copy) as T;
  if (Array.isArray(copy)) return copy.map(typesetCopy) as T;
  if (copy && typeof copy === "object") {
    return Object.fromEntries(
      Object.entries(copy).map(([key, value]) => [key, typesetCopy(value)]),
    ) as T;
  }
  return copy;
}

/** Back to ordinary spaces, for text that leaves the page. */
export function plainSpaces(text: string): string {
  return text.replaceAll(NBSP, " ");
}
