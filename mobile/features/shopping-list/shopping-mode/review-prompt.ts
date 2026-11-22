import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { Platform } from "react-native";

import { Analytics } from "@/lib/analytics";

import { shouldRequestStoreReview } from "./review-prompt-eligibility";

const FINISHED_KEY = "kangur.review.finishedCount.v1";
const LAST_KEY = "kangur.review.lastRequestedAt.v1";
/** Let the app land on Home before the system sheet appears. */
const REQUEST_DELAY_MS = 1200;

/**
 * Counts finished trips and, after the second good one, asks the OS for the
 * store review sheet. The OS decides whether it actually shows; nothing is
 * ever offered in exchange for a review.
 */
export async function recordFinishedTripAndMaybeAskForReview(
  boughtCount: number,
): Promise<void> {
  try {
    const finishedCount =
      Number((await AsyncStorage.getItem(FINISHED_KEY)) ?? "0") + 1;
    await AsyncStorage.setItem(FINISHED_KEY, String(finishedCount));
    const last = await AsyncStorage.getItem(LAST_KEY);
    const eligible = shouldRequestStoreReview({
      platformOS: Platform.OS,
      finishedCount,
      boughtCount,
      lastRequestedAtMs: last ? Number(last) : null,
      nowMs: Date.now(),
    });
    if (!eligible || !(await StoreReview.isAvailableAsync())) return;
    await AsyncStorage.setItem(LAST_KEY, String(Date.now()));
    Analytics.track("review_prompt_requested", {
      finished_count: finishedCount,
      bought_count: boughtCount,
    });
    setTimeout(() => {
      void StoreReview.requestReview().catch(() => undefined);
    }, REQUEST_DELAY_MS);
  } catch {
    // Review prompts are best effort.
  }
}
