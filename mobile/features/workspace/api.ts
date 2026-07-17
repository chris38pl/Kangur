import { apiFetch } from "@/lib/api/client";

import {
  WorkspaceListSchema,
  WorkspaceMemberListSchema,
  WorkspaceSchema,
  type Workspace,
  type WorkspaceMember,
} from "./schemas";

export async function listWorkspaces(token: string): Promise<Workspace[]> {
  const data = await apiFetch<unknown>("/api/v1/workspaces", { token });
  return WorkspaceListSchema.parse(data).workspaces;
}

export async function createWorkspace(
  token: string,
  body: { name: string; icon: string },
): Promise<Workspace> {
  const data = await apiFetch<unknown>("/api/v1/workspaces", {
    token,
    method: "POST",
    body,
  });
  return WorkspaceSchema.parse(data);
}

export async function getWorkspace(
  token: string,
  workspaceId: string,
): Promise<Workspace> {
  const data = await apiFetch<unknown>(`/api/v1/workspaces/${workspaceId}`, {
    token,
  });
  return WorkspaceSchema.parse(data);
}

export async function updateWorkspace(
  token: string,
  workspaceId: string,
  body: { name?: string; icon?: string },
): Promise<Workspace> {
  const data = await apiFetch<unknown>(`/api/v1/workspaces/${workspaceId}`, {
    token,
    method: "PATCH",
    body,
  });
  return WorkspaceSchema.parse(data);
}

export async function listWorkspaceMembers(
  token: string,
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const data = await apiFetch<unknown>(
    `/api/v1/workspaces/${workspaceId}/members`,
    { token },
  );
  return WorkspaceMemberListSchema.parse(data).members;
}
