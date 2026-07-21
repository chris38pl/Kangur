import { validationError } from "@/lib/auth/errors";
import { getPremiumPriceId, getStripe } from "@/lib/stripe";

export type PremiumPriceDto = {
  priceId: string;
  /** Amount in major currency units (e.g. 99 for 99.00 PLN). */
  amount: number;
  /** ISO currency code lowercased (e.g. "pln"). */
  currency: string;
  interval: "day" | "week" | "month" | "year" | null;
  /** Localized display string from Stripe amount + currency (e.g. "99,00 zł"). */
  formatted: string;
};

export async function getPremiumPrice(): Promise<PremiumPriceDto> {
  const stripe = getStripe();
  const priceId = getPremiumPriceId();
  const price = await stripe.prices.retrieve(priceId);

  const unitAmount = price.unit_amount;
  if (unitAmount == null) {
    throw validationError("Premium price has no unit_amount.");
  }

  const currency = price.currency.toLowerCase();
  const amount = unitAmount / 100;
  const interval = price.recurring?.interval ?? null;

  const formatted = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return {
    priceId,
    amount,
    currency,
    interval,
    formatted,
  };
}
