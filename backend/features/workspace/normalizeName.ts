/** Trim and collapse internal whitespace. */
export function normalizeWorkspaceName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}
