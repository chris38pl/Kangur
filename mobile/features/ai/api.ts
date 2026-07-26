import { fetch as expoFetch } from "expo/fetch";

import { apiFetch, ApiClientError, type ApiErrorCode } from "@/lib/api/client";
import {
  httpLogNetworkError,
  httpLogRequest,
  httpLogResponse,
} from "@/lib/api/http-logger";

import {
  AiIngestResponseSchema,
  ApplyAiProposalResponseSchema,
  ApplySuggestFromHistoryResponseSchema,
  MealProposalResponseSchema,
  SuggestFromHistoryResponseSchema,
  type MealProposalResponse,
  type SuggestFromHistoryResponse,
} from "./schemas";

export async function ingestAi(
  token: string,
  listId: string,
  formData: FormData,
) {
  const base = process.env.EXPO_PUBLIC_API_URL?.trim()?.replace(/\/$/, "");
  if (!base) {
    throw new ApiClientError(
      "NETWORK_ERROR",
      "EXPO_PUBLIC_API_URL is not set",
    );
  }

  const path = `/api/v1/lists/${listId}/ai/ingest`;
  const method = "POST";
  const started = Date.now();
  httpLogRequest({
    method,
    url: path,
    body: { formData: true },
  });

  let res: Response;
  try {
    // expo/fetch + expo-file-system File (FormData) - global fetch rejects RN file parts.
    res = await expoFetch(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });
  } catch (err) {
    httpLogNetworkError({
      method,
      url: path,
      durationMs: Date.now() - started,
      error: err instanceof Error ? err.message : "Network request failed",
    });
    throw new ApiClientError(
      "NETWORK_ERROR",
      err instanceof Error ? err.message : "Network request failed.",
    );
  }

  const json: unknown = await res.json();
  httpLogResponse({
    method,
    url: path,
    status: res.status,
    durationMs: Date.now() - started,
    body: json,
  });

  if (!res.ok) {
    let code: ApiErrorCode = "UNKNOWN";
    let message = `Request failed (${res.status})`;
    let details: Record<string, unknown> | undefined;
    if (json && typeof json === "object") {
      const data = json as {
        code?: ApiErrorCode;
        message?: string;
        details?: Record<string, unknown>;
      };
      if (data.code) code = data.code;
      if (typeof data.message === "string" && data.message) {
        message = data.message;
      }
      if (data.details && typeof data.details === "object") {
        details = data.details;
      }
    }
    throw new ApiClientError(code, message, res.status, details);
  }

  return AiIngestResponseSchema.parse(json);
}

export async function applyAi(
  token: string,
  listId: string,
  body: {
    runId: string;
    operations: Record<string, unknown>[];
  },
) {
  const data = await apiFetch<unknown>(`/api/v1/lists/${listId}/ai/apply`, {
    token,
    method: "POST",
    body,
  });

  return ApplyAiProposalResponseSchema.parse(data);
}

export async function suggestFromHistory(
  token: string,
  workspaceId: string,
): Promise<SuggestFromHistoryResponse> {
  const data = await apiFetch<unknown>(
    `/api/v1/workspaces/${workspaceId}/ai/suggest-from-history`,
    { token, method: "POST" },
  );
  return SuggestFromHistoryResponseSchema.parse(data);
}

export async function applySuggestFromHistory(
  token: string,
  workspaceId: string,
  body: { runId: string; acceptedProposalRowIds: string[] },
) {
  const data = await apiFetch<unknown>(
    `/api/v1/workspaces/${workspaceId}/ai/suggest-from-history/apply`,
    { token, method: "POST", body },
  );
  return ApplySuggestFromHistoryResponseSchema.parse(data);
}

export async function abandonSuggestFromHistory(
  token: string,
  workspaceId: string,
  runId: string,
) {
  await apiFetch(
    `/api/v1/workspaces/${workspaceId}/ai/suggest-from-history/abandon`,
    {
      token,
      method: "POST",
      body: { runId },
    },
  );
}

export async function createMealProposal(
  token: string,
  listId: string,
  dishes: string[],
): Promise<MealProposalResponse> {
  const data = await apiFetch<unknown>(
    `/api/v1/lists/${listId}/ai/meal-proposal`,
    { token, method: "POST", body: { dishes } },
  );
  return MealProposalResponseSchema.parse(data);
}

export async function abandonMealProposal(
  token: string,
  listId: string,
  runId: string,
) {
  await apiFetch(`/api/v1/lists/${listId}/ai/meal-proposal/abandon`, {
    token,
    method: "POST",
    body: { runId },
  });
}
