import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const AiCreditsBalanceSchema = z
  .object({
    used: z.number().int().nonnegative(),
    limit: z.number().int().positive().nullable(),
    remaining: z.number().int().nonnegative().nullable(),
    unlimited: z.boolean(),
    periodStart: z.string().datetime(),
  })
  .openapi("AiCreditsBalance");

export type AiCreditsBalanceDto = z.infer<typeof AiCreditsBalanceSchema>;

export const BillingCheckoutResponseSchema = z
  .object({
    url: z.string().url(),
  })
  .openapi("BillingCheckoutResponse");

export const BillingPortalResponseSchema = z
  .object({
    url: z.string().url(),
  })
  .openapi("BillingPortalResponse");

export const BillingSyncResponseSchema = z
  .object({
    plan: z.enum(["free", "premium"]),
    status: z.string(),
    currentPeriodEnd: z.string().datetime().nullable(),
  })
  .openapi("BillingSyncResponse");

export const BillingWebhookAckSchema = z
  .object({
    received: z.literal(true),
  })
  .openapi("BillingWebhookAck");

export const PremiumPriceSchema = z
  .object({
    priceId: z.string(),
    amount: z.number().nonnegative(),
    currency: z.string().min(3).max(3),
    interval: z.enum(["day", "week", "month", "year"]).nullable(),
    formatted: z.string(),
  })
  .openapi("PremiumPrice");

export type PremiumPriceDto = z.infer<typeof PremiumPriceSchema>;
