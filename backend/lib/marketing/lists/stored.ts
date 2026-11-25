/**
 * Things read back from the browser. Nothing here is trusted: an older version of the page,
 * another tab or a curious person may have left anything there, and a calculator must not
 * fall over because of it.
 */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function clampInt(
  value: unknown,
  { min, max }: { min: number; max: number },
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Only the switches we know, only true or false. */
export function flags(
  value: unknown,
  ids: readonly string[],
): Partial<Record<string, boolean>> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    ids.flatMap((id) => (typeof value[id] === "boolean" ? [[id, value[id] as boolean]] : [])),
  );
}

export const strings = (value: unknown): readonly string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
