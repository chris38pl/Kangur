import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

import { AppLocaleSchema } from "@/lib/locale";

extendZodWithOpenApi(z);

export const ApiErrorSchema = z
  .object({
    code: z.enum([
      "AUTH_REQUIRED",
      "INVALID_TOKEN",
      "TOKEN_EXPIRED",
      "NOT_FOUND",
      "VALIDATION_ERROR",
      "FORBIDDEN",
      "CONFLICT",
      "INSUFFICIENT_CREDITS",
      "HISTORY_LIMIT_EXCEEDED",
      "PREMIUM_REQUIRED",
      "AI_UNAVAILABLE",
    ]),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .openapi("ApiError");

export const PlatformRoleSchema = z
  .enum(["USER", "ADMIN"])
  .openapi("PlatformRole");

export const MeResponseSchema = z
  .object({
    id: z.string(),
    clerkId: z.string(),
    email: z.string().email(),
    locale: AppLocaleSchema.nullable(),
    platformRole: PlatformRoleSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("MeResponse");

export type MeResponse = z.infer<typeof MeResponseSchema>;

export const UpdateMeBodySchema = z
  .object({
    locale: AppLocaleSchema,
  })
  .openapi("UpdateMeBody");

export type UpdateMeBody = z.infer<typeof UpdateMeBodySchema>;
