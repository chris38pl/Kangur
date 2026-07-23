import type { AiCreditsBalance } from "./schemas";

/** Soft upsell when Free balance is nearly empty (not only at zero). */
export const CREDITS_LOW_THRESHOLD = 3;

export function isCreditsLow(
  balance: Pick<AiCreditsBalance, "unlimited" | "remaining"> | null | undefined,
): boolean {
  if (!balance || balance.unlimited) return false;
  const remaining = balance.remaining ?? 0;
  return remaining <= CREDITS_LOW_THRESHOLD;
}
