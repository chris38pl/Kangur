import { apiFetch } from "@/lib/api/client";

import {
  PlatformWorkspaceDetailResponseSchema,
  PlatformWorkspaceListResponseSchema,
  type PlatformWorkspaceListItem,
  type PlatformWorkspaceListResponse,
  type Workspace,
} from "./schemas";

export type ListPlatformWorkspacesParams = {
  q?: string;
  plan?: "all" | "free" | "premium";
  cursor?: string;
};

export async function listPlatformWorkspaces(
  token: string,
  params: ListPlatformWorkspacesParams = {},
): Promise<PlatformWorkspaceListResponse> {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.plan && params.plan !== "all") search.set("plan", params.plan);
  if (params.cursor) search.set("cursor", params.cursor);
  const qs = search.toString();
  const path = qs
    ? `/api/v1/platform/workspaces?${qs}`
    : "/api/v1/platform/workspaces";
  const data = await apiFetch<unknown>(path, { token });
  return PlatformWorkspaceListResponseSchema.parse(data);
}

export async function getPlatformWorkspaceDetail(
  token: string,
  workspaceId: string,
): Promise<Workspace> {
  const data = await apiFetch<unknown>(
    `/api/v1/platform/workspaces/${workspaceId}`,
    { token },
  );
  return PlatformWorkspaceDetailResponseSchema.parse(data).workspace;
}

export async function deletePlatformWorkspace(
  token: string,
  workspaceId: string,
): Promise<void> {
  await apiFetch(`/api/v1/platform/workspaces/${workspaceId}`, {
    token,
    method: "DELETE",
  });
}

export type { PlatformWorkspaceListItem };
