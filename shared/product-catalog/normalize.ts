/** Normalize catalog query / name for matching (trim, collapse space, lower). */
export function normalizeCatalogText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function tokenizeCatalogText(normalized: string): string[] {
  return normalized.split(" ").filter(Boolean);
}
