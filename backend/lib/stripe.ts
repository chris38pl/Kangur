import Stripe from "stripe";

import { validationError } from "@/lib/auth/errors";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw validationError("Stripe is not configured (STRIPE_SECRET_KEY).");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw validationError("Stripe is not configured (STRIPE_WEBHOOK_SECRET).");
  }
  return secret;
}

export function getPremiumPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY?.trim();
  if (!priceId) {
    throw validationError(
      "Stripe is not configured (STRIPE_PRICE_PREMIUM_MONTHLY).",
    );
  }
  return priceId;
}

/** Deep-link / web base after Checkout or Portal (no trailing slash). */
export function getBillingReturnUrlBase(): string {
  const base =
    process.env.BILLING_RETURN_URL_BASE?.trim() || "kangur://premium";
  return base.replace(/\/$/, "");
}
