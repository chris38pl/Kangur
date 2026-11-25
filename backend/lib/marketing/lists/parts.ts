import { formatLine, type ListLine } from "@/lib/marketing/lists/format";
import { plainSpaces } from "@/lib/marketing/typography";

/** The most text Kangur takes in at once: MAX_INGEST_TEXT_CHARS in the app's own API. */
export const KANGUR_LIMIT = 8000;

/** One trip to the shop, one list in Kangur. */
export type KangurPart = { key: string; label: string; count: number; text: string };

/**
 * Text for the "Schowek" tile in Kangur: what the list is for, which becomes its name there,
 * then one product per line. No headings: Kangur has its own aisles, and it could take a
 * heading for a product.
 */
export function kangurPart(
  key: string,
  label: string,
  title: string,
  lines: readonly ListLine[],
): KangurPart {
  return {
    key,
    label,
    count: lines.length,
    text: [plainSpaces(title), ...lines.map((line) => `- ${formatLine(line)}`)].join("\n"),
  };
}

/** A list too long for one go is taken in several. */
export function kangurParts(title: string, lines: readonly ListLine[]): KangurPart[] {
  const bundles: ListLine[][] = [];
  let room = 0;
  for (const line of lines) {
    const cost = formatLine(line).length + 3;
    if (bundles.length === 0 || cost > room) {
      bundles.push([]);
      room = KANGUR_LIMIT - title.length - ", część 99".length;
    }
    bundles[bundles.length - 1].push(line);
    room -= cost;
  }
  return bundles.map((bundle, i) =>
    bundles.length === 1
      ? kangurPart("all", title, title, bundle)
      : kangurPart(`part-${i + 1}`, `Część ${i + 1}`, `${title}, część ${i + 1}`, bundle),
  );
}
