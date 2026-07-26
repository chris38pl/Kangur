import { apiFetch } from "@/lib/api/client";

import {
  CreateFeedbackResponseSchema,
  FeedbackDetailResponseSchema,
  FeedbackListResponseSchema,
  type CreateFeedbackInput,
  type FeedbackDTO,
  type FeedbackListResponse,
  type FeedbackStatus,
  type FeedbackType,
  type UpdateFeedbackInput,
} from "./schemas";

export async function createFeedback(
  token: string,
  input: CreateFeedbackInput,
): Promise<FeedbackDTO> {
  const data = await apiFetch<unknown>("/api/v1/feedback", {
    token,
    method: "POST",
    body: input,
  });
  return CreateFeedbackResponseSchema.parse(data).feedback;
}

export type ListFeedbackParams = {
  status?: FeedbackStatus;
  type?: FeedbackType;
  unresolvedOnly?: boolean;
  cursor?: string;
};

export async function listPlatformFeedback(
  token: string,
  params: ListFeedbackParams = {},
): Promise<FeedbackListResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.type) search.set("type", params.type);
  if (params.unresolvedOnly) search.set("unresolvedOnly", "true");
  if (params.cursor) search.set("cursor", params.cursor);
  const qs = search.toString();
  const path = qs
    ? `/api/v1/platform/feedback?${qs}`
    : "/api/v1/platform/feedback";
  const data = await apiFetch<unknown>(path, { token });
  return FeedbackListResponseSchema.parse(data);
}

export async function getPlatformFeedback(
  token: string,
  feedbackId: string,
): Promise<FeedbackDTO> {
  const data = await apiFetch<unknown>(
    `/api/v1/platform/feedback/${feedbackId}`,
    { token },
  );
  return FeedbackDetailResponseSchema.parse(data).feedback;
}

export async function updatePlatformFeedback(
  token: string,
  feedbackId: string,
  input: UpdateFeedbackInput,
): Promise<FeedbackDTO> {
  const data = await apiFetch<unknown>(
    `/api/v1/platform/feedback/${feedbackId}`,
    {
      token,
      method: "PATCH",
      body: input,
    },
  );
  return FeedbackDetailResponseSchema.parse(data).feedback;
}
