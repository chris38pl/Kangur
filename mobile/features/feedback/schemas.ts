import { z } from "zod";

export const FeedbackTypeSchema = z.enum(["BUG", "FEATURE_REQUEST"]);
export type FeedbackType = z.infer<typeof FeedbackTypeSchema>;

export const FeedbackStatusSchema = z.enum([
  "NEW",
  "TRIAGED",
  "IN_PROGRESS",
  "DONE",
  "RELEASED",
]);
export type FeedbackStatus = z.infer<typeof FeedbackStatusSchema>;

const AppLocaleSchema = z.enum([
  "pl",
  "en",
  "de",
  "ru",
  "uk",
  "fr",
  "es",
  "it",
  "cs",
  "be",
]);

const FeedbackUserSchema = z.object({
  id: z.string(),
  email: z.string(),
});

export const FeedbackDTOSchema = z.object({
  id: z.string(),
  type: FeedbackTypeSchema,
  title: z.string(),
  description: z.string(),
  language: AppLocaleSchema,
  attachmentKey: z.string().nullable(),
  attachmentUrl: z.string().nullable(),
  hasAttachment: z.boolean(),
  status: FeedbackStatusSchema,
  adminNote: z.string().nullable(),
  userId: z.string(),
  user: FeedbackUserSchema.optional(),
  metadataVersion: z.number().int(),
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
  closedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FeedbackDTO = z.infer<typeof FeedbackDTOSchema>;

export const CreateFeedbackResponseSchema = z.object({
  feedback: FeedbackDTOSchema,
});

export const FeedbackListResponseSchema = z.object({
  items: z.array(FeedbackDTOSchema),
  nextCursor: z.string().nullable(),
});

export type FeedbackListResponse = z.infer<typeof FeedbackListResponseSchema>;

export const FeedbackDetailResponseSchema = z.object({
  feedback: FeedbackDTOSchema,
});

export type CreateFeedbackInput = {
  type: FeedbackType;
  title: string;
  description: string;
  language: z.infer<typeof AppLocaleSchema>;
  attachmentKey?: string | null;
  attachmentUrl?: string | null;
  appVersion?: string | null;
  buildNumber?: string | null;
  platform?: string | null;
  deviceModel?: string | null;
  osVersion?: string | null;
  environment?: string | null;
  apiBaseUrl?: string | null;
  workspaceId?: string | null;
  listId?: string | null;
  shoppingSessionId?: string | null;
  route?: string | null;
};

export type UpdateFeedbackInput = {
  status?: FeedbackStatus;
  adminNote?: string | null;
};
