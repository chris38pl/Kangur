import { z } from "zod";

export const AiCreditsBalanceSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive().nullable(),
  remaining: z.number().int().nonnegative().nullable(),
  unlimited: z.boolean(),
  periodStart: z.string().datetime(),
});

export type AiCreditsBalance = z.infer<typeof AiCreditsBalanceSchema>;
