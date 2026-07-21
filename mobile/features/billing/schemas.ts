import { z } from "zod";

export const AiCreditsBalanceSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive().nullable(),
  remaining: z.number().int().nonnegative().nullable(),
  unlimited: z.boolean(),
  periodStart: z.string().datetime(),
});

export type AiCreditsBalance = z.infer<typeof AiCreditsBalanceSchema>;

export const BillingUrlResponseSchema = z.object({
  url: z.string().url(),
});

export type BillingUrlResponse = z.infer<typeof BillingUrlResponseSchema>;

export const PremiumPriceSchema = z.object({
  priceId: z.string(),
  amount: z.number().nonnegative(),
  currency: z.string().min(3).max(3),
  interval: z.enum(["day", "week", "month", "year"]).nullable(),
  formatted: z.string(),
});

export type PremiumPrice = z.infer<typeof PremiumPriceSchema>;

export const BillingSyncResponseSchema = z.object({
  plan: z.enum(["free", "premium"]),
  status: z.string(),
  currentPeriodEnd: z.string().nullable().optional().default(null),
});

export type BillingSyncResponse = z.infer<typeof BillingSyncResponseSchema>;
