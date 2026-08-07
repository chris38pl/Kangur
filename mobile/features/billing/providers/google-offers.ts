import type { SubscriptionOffer } from "expo-iap";

/**
 * Google Play subscription offer selection — lives next to the Google adapter only.
 * expo-iap requires an explicit offerToken; the library does not auto-pick free trial.
 */

export function offerTokenOf(offer: SubscriptionOffer): string | null {
  const token = offer.offerTokenAndroid?.trim();
  return token ? token : null;
}

export function isFreeTrialOffer(offer: SubscriptionOffer): boolean {
  if (offer.paymentMode === "free-trial") return true;
  if (offer.type === "introductory" && offer.price === 0) return true;
  const phases = offer.pricingPhasesAndroid?.pricingPhaseList ?? [];
  return phases.some(
    (phase) =>
      phase.priceAmountMicros === "0" ||
      phase.formattedPrice.trim().toLowerCase() === "free",
  );
}

/** Recurring (paid) phase price for paywall display after a free trial. */
export function recurringDisplayPrice(offer: SubscriptionOffer): string {
  const phases = offer.pricingPhasesAndroid?.pricingPhaseList ?? [];
  for (let i = phases.length - 1; i >= 0; i -= 1) {
    const phase = phases[i];
    if (phase.priceAmountMicros !== "0") {
      return phase.formattedPrice;
    }
  }
  return offer.displayPrice;
}

export function trialPhaseSummary(offer: SubscriptionOffer): {
  displayPrice: string;
  period?: string;
  paymentMode?: string;
} | null {
  if (!isFreeTrialOffer(offer)) return null;
  const phases = offer.pricingPhasesAndroid?.pricingPhaseList ?? [];
  const freePhase = phases.find((p) => p.priceAmountMicros === "0");
  return {
    displayPrice: freePhase?.formattedPrice || offer.displayPrice || "Free",
    period: freePhase?.billingPeriod || offer.period?.unit,
    paymentMode: offer.paymentMode ?? "free-trial",
  };
}

/**
 * Prefer preferredOfferId → free-trial for base plan → any offer for base plan.
 */
export function selectSubscriptionOffer(
  offers: readonly SubscriptionOffer[],
  opts: { basePlanId: string; preferredOfferId?: string | null },
): SubscriptionOffer | null {
  if (!offers.length) return null;

  const forPlan = offers.filter(
    (o) =>
      !o.basePlanIdAndroid || o.basePlanIdAndroid === opts.basePlanId,
  );
  const pool = forPlan.length > 0 ? forPlan : [...offers];

  if (opts.preferredOfferId) {
    const byId = pool.find(
      (o) => o.id === opts.preferredOfferId && offerTokenOf(o),
    );
    if (byId) return byId;
  }

  const trial = pool.find((o) => isFreeTrialOffer(o) && offerTokenOf(o));
  if (trial) return trial;

  return pool.find((o) => offerTokenOf(o)) ?? null;
}

export function serializeOfferForDebug(offer: SubscriptionOffer) {
  return {
    id: offer.id,
    basePlanIdAndroid: offer.basePlanIdAndroid ?? null,
    offerTokenAndroid: offer.offerTokenAndroid ?? null,
    displayPrice: offer.displayPrice,
    currency: offer.currency ?? null,
    price: offer.price,
    paymentMode: offer.paymentMode ?? null,
    type: offer.type,
    period: offer.period ?? null,
    periodCount: offer.periodCount ?? null,
    offerTagsAndroid: offer.offerTagsAndroid ?? null,
    pricingPhasesAndroid: offer.pricingPhasesAndroid?.pricingPhaseList ?? [],
    isFreeTrial: isFreeTrialOffer(offer),
  };
}
