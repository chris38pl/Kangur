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
      "HISTORY_ALREADY_ON_LIST",
      "PREMIUM_REQUIRED",
      "AI_UNAVAILABLE",
      "RATE_LIMITED",
      "WORKSPACE_HAS_ACTIVE_SUBSCRIPTION",
      "LAST_WORKSPACE",
      "OWNER_CANNOT_LEAVE",
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
    /**
     * What other people see: the name typed in Kangur, the Clerk name, or a name read from
     * the address. Null when they see the fallback word ("Domownik").
     */
    displayName: z.string().nullable(),
    /** The address is an Apple relay address: the app says "hidden by Apple" instead. */
    emailHidden: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("MeResponse");

export type MeResponse = z.infer<typeof MeResponseSchema>;

export const UpdateMeBodySchema = z
  .object({
    locale: AppLocaleSchema.optional(),
    /**
     * 1 to 30 characters, not an e-mail address. Null removes the name. Stays in Kangur:
     * nothing is written to Clerk.
     */
    displayName: z.string().max(200).nullable().optional(),
  })
  .refine((body) => body.locale !== undefined || body.displayName !== undefined, {
    message: "Provide locale and/or displayName.",
  })
  .openapi("UpdateMeBody");

export type UpdateMeBody = z.infer<typeof UpdateMeBodySchema>;
