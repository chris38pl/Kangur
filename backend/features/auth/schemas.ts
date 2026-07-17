import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

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
    ]),
    message: z.string(),
  })
  .openapi("ApiError");

export const MeResponseSchema = z
  .object({
    id: z.string(),
    clerkId: z.string(),
    email: z.string().email(),
    locale: z.enum(["pl", "en"]).nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("MeResponse");

export type MeResponse = z.infer<typeof MeResponseSchema>;
