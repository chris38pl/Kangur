/** When to ask the OS for a store review after finished shopping. Pure for node --test. */
export const REVIEW_MIN_FINISHED = 2;
export const REVIEW_MIN_BOUGHT = 3;
export const REVIEW_COOLDOWN_MS = 120 * 24 * 60 * 60 * 1000;

export function shouldRequestStoreReview(input: {
  platformOS: string;
  finishedCount: number;
  boughtCount: number;
  lastRequestedAtMs: number | null;
  nowMs: number;
}): boolean {
  if (input.platformOS !== "ios" && input.platformOS !== "android") return false;
  if (input.finishedCount < REVIEW_MIN_FINISHED) return false;
  if (input.boughtCount < REVIEW_MIN_BOUGHT) return false;
  if (
    input.lastRequestedAtMs != null &&
    input.nowMs - input.lastRequestedAtMs < REVIEW_COOLDOWN_MS
  ) {
    return false;
  }
  return true;
}
