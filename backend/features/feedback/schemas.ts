import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { AppLocaleSchema } from "@/lib/locale";

extendZodWithOpenApi(z);

export const FeedbackTypeSchema = z
  .enum(["BUG", "FEATURE_REQUEST"])
  .openapi("FeedbackType");

export const FeedbackStatusSchema = z
  .enum(["NEW", "TRIAGED", "IN_PROGRESS", "DONE", "RELEASED"])
  .openapi("FeedbackStatus");

const FeedbackUserSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
  })
  .openapi("FeedbackUser");

export const FeedbackDTOSchema = z
  .object({
    id: z.string(),
    type: FeedbackTypeSchema,
    title: z.string(),
    description: z.string(),
    language: AppLocaleSchema,
    attachmentKey: z.string().nullable(),
    attachmentUrl: z.string().url().nullable(),
    hasAttachment: z.boolean(),
    status: FeedbackStatusSchema,
    adminNote: z.string().nullable(),
    userId: z.string(),
    user: FeedbackUserSchema.optional(),
    metadataVersion: z.number().int().positive(),
    appVersion: z.string().nullable(),
    buildNumber: z.string().nullable(),
    platform: z.string().nullable(),
    deviceModel: z.string().nullable(),
    osVersion: z.string().nullable(),
    environment: z.string().nullable(),
    apiBaseUrl: z.string().nullable(),
    workspaceId: z.string().nullable(),
    listId: z.string().nullable(),
    shoppingSessionId: z.string().nullable(),
    route: z.string().nullable(),
    resolvedInVersion: z.string().nullable(),
    closedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("FeedbackDTO");

export type FeedbackDTO = z.infer<typeof FeedbackDTOSchema>;

export const CreateFeedbackBodySchema = z
  .object({
    type: FeedbackTypeSchema,
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(4000),
    language: AppLocaleSchema,
    attachmentKey: z.string().trim().min(1).max(512).nullable().optional(),
    attachmentUrl: z.string().url().nullable().optional(),
    appVersion: z.string().trim().min(1).max(64).nullable().optional(),
    buildNumber: z.string().trim().min(1).max(64).nullable().optional(),
    platform: z.string().trim().min(1).max(32).nullable().optional(),
    deviceModel: z.string().trim().min(1).max(120).nullable().optional(),
    osVersion: z.string().trim().min(1).max(64).nullable().optional(),
    environment: z.string().trim().min(1).max(32).nullable().optional(),
    apiBaseUrl: z.string().trim().min(1).max(512).nullable().optional(),
    workspaceId: z.string().trim().min(1).max(64).nullable().optional(),
    listId: z.string().trim().min(1).max(64).nullable().optional(),
    shoppingSessionId: z.string().trim().min(1).max(64).nullable().optional(),
    route: z.string().trim().min(1).max(512).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const key = value.attachmentKey ?? null;
    const url = value.attachmentUrl ?? null;
    const hasKey = key != null && key.length > 0;
    const hasUrl = url != null && url.length > 0;
    if (hasKey !== hasUrl) {
      ctx.addIssue({
        code: "custom",
        message: "attachmentKey and attachmentUrl must both be set or both omitted.",
        path: ["attachmentKey"],
      });
    }
  })
  .openapi("CreateFeedbackBody");

export type CreateFeedbackBody = z.infer<typeof CreateFeedbackBodySchema>;

export const CreateFeedbackResponseSchema = z
  .object({
    feedback: FeedbackDTOSchema,
  })
  .openapi("CreateFeedbackResponse");

export type CreateFeedbackResponse = z.infer<
  typeof CreateFeedbackResponseSchema
>;

export const ListFeedbackQuerySchema = z
  .object({
    status: FeedbackStatusSchema.optional(),
    type: FeedbackTypeSchema.optional(),
    unresolvedOnly: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
    cursor: z.string().optional(),
  })
  .openapi("ListFeedbackQuery");

export type ListFeedbackQuery = z.infer<typeof ListFeedbackQuerySchema>;

export const FeedbackListResponseSchema = z
  .object({
    items: z.array(FeedbackDTOSchema),
    nextCursor: z.string().nullable(),
  })
  .openapi("FeedbackListResponse");

export type FeedbackListResponse = z.infer<typeof FeedbackListResponseSchema>;

export const FeedbackDetailResponseSchema = z
  .object({
    feedback: FeedbackDTOSchema,
  })
  .openapi("FeedbackDetailResponse");

export type FeedbackDetailResponse = z.infer<
  typeof FeedbackDetailResponseSchema
>;

/**
 * Admin PATCH allowlist only. Content + metadata are immutable.
 * `.strict()` rejects any other keys.
 */
export const UpdateFeedbackBodySchema = z
  .object({
    status: FeedbackStatusSchema.optional(),
    adminNote: z.string().trim().max(4000).nullable().optional(),
  })
  .strict()
  .refine(
    (value) => value.status !== undefined || value.adminNote !== undefined,
    { message: "At least one of status or adminNote is required." },
  )
  .openapi("UpdateFeedbackBody");

export type UpdateFeedbackBody = z.infer<typeof UpdateFeedbackBodySchema>;
