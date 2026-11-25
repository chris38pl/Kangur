/** One product as people read it: "Mąka pszenna, 1,5 kg". */
export type ListLine = {
  name: string;
  quantity?: string | null;
  note?: string | null;
};

export type ListGroup = { title: string; lines: readonly ListLine[] };

export function formatLine({ name, quantity, note }: ListLine): string {
  return [name, quantity, note ? `(${note})` : null]
    .filter(Boolean)
    .join(" ")
    .replace(/ /g, " ");
}

/**
 * Plain text for a message, a note or the "Tekst ze schowka" import in Kangur. Headings
 * help people and do not confuse the import, they are not products.
 */
export function listToText(title: string, groups: readonly ListGroup[]): string {
  const blocks = groups
    .filter((group) => group.lines.length > 0)
    .map((group) =>
      [
        group.title.toLocaleUpperCase("pl"),
        ...group.lines.map((line) => `- ${formatLine(line)}`),
      ].join("\n"),
    );
  return [title, ...blocks].join("\n\n");
}

/** 1 produkt, 2 produkty, 5 produktów. */
export function plural(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const tens = count % 100;
  const units = count % 10;
  if (count === 1) return `${count} ${one}`;
  if (units >= 2 && units <= 4 && !(tens >= 12 && tens <= 14)) {
    return `${count} ${few}`;
  }
  return `${count} ${many}`;
}

/** Polish decimals: 1.5 becomes "1,5", 2 stays "2". */
export function decimal(value: number): string {
  return String(Math.round(value * 100) / 100).replace(".", ",");
}
