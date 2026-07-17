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
