/**
 * The name field: what the server accepts (backend/lib/names/displayName.ts), checked
 * before sending. Pure, for node tests.
 */
export const DISPLAY_NAME_MAX = 30;

export function normalizeNameInput(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/** Null when the name can be saved, or when the field is empty (skipping is allowed). */
export type NameProblem = "email" | "too_long" | null;

export function nameProblem(raw: string): NameProblem {
  const name = normalizeNameInput(raw);
  if (!name) return null;
  if (/[^\s@]+@[^\s@]+/.test(name)) return "email";
  if ([...name].length > DISPLAY_NAME_MAX) return "too_long";
  return null;
}

/** A name worth sending: not empty and without a problem. */
export function savableName(raw: string): string | null {
  const name = normalizeNameInput(raw);
  return name && nameProblem(name) === null ? name : null;
}
