import { ApiClientError } from "@/lib/api/client";

export type CreditShortage = {
  needed: number;
  remaining: number;
};

function asNonNegativeInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const n = Math.trunc(value);
  return n >= 0 ? n : null;
}

/** Prefer structured API `details`; fall back to parsing the message. */
export function getCreditShortage(
  error: unknown,
): CreditShortage | null {
  if (!(error instanceof ApiClientError)) return null;
  if (error.code !== "INSUFFICIENT_CREDITS" && error.status !== 402) {
    return null;
  }

  const needed = asNonNegativeInt(error.details?.needed);
  const remaining = asNonNegativeInt(error.details?.remaining);
  if (needed != null && remaining != null) {
    return { needed, remaining };
  }

  const match = error.message.match(
    /Need\s+(\d+).*have\s+(\d+)/i,
  );
  if (match) {
    return {
      needed: Number.parseInt(match[1]!, 10),
      remaining: Number.parseInt(match[2]!, 10),
    };
  }

  return { needed: 1, remaining: 0 };
}

export function isInsufficientCreditsError(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.code === "INSUFFICIENT_CREDITS" || error.status === 402)
  );
}
