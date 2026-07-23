import { apiFetch } from "@/lib/api/client";

import {
  AcceptInvitationResultSchema,
  InvitationListSchema,
  InvitationPreviewSchema,
  InviteMemberResultSchema,
  WorkspaceListSchema,
  WorkspaceMemberListSchema,
  WorkspaceSchema,
  type AcceptInvitationResult,
  type Invitation,
  type InvitationPreview,
  type InviteMemberResult,
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

export async function removeWorkspaceMember(
  token: string,
  workspaceId: string,
  userId: string,
): Promise<void> {
  await apiFetch(`/api/v1/workspaces/${workspaceId}/members/${userId}`, {
    token,
    method: "DELETE",
  });
}

export async function updateWorkspaceMemberRole(
  token: string,
  workspaceId: string,
  userId: string,
  role: "admin" | "member",
): Promise<void> {
  await apiFetch(`/api/v1/workspaces/${workspaceId}/members/${userId}`, {
    token,
    method: "PATCH",
    body: { role },
  });
}

export async function listInvitations(
  token: string,
  workspaceId: string,
): Promise<Invitation[]> {
  const data = await apiFetch<unknown>(
    `/api/v1/workspaces/${workspaceId}/invitations`,
    { token },
  );
  return InvitationListSchema.parse(data).invitations;
}

export async function createInvitation(
  token: string,
  workspaceId: string,
  body: { email: string; role?: "admin" | "member" },
): Promise<InviteMemberResult> {
  const data = await apiFetch<unknown>(
    `/api/v1/workspaces/${workspaceId}/invitations`,
    {
      token,
      method: "POST",
      body,
    },
  );
  return InviteMemberResultSchema.parse(data);
}

export async function revokeInvitation(
  token: string,
  workspaceId: string,
  invitationId: string,
): Promise<void> {
  await apiFetch(
    `/api/v1/workspaces/${workspaceId}/invitations/${invitationId}`,
    {
      token,
      method: "DELETE",
    },
  );
}

export async function acceptInvitation(
  token: string,
  capability: { inviteToken: string } | { invitationId: string },
): Promise<AcceptInvitationResult> {
  const body =
    "inviteToken" in capability
      ? { token: capability.inviteToken }
      : { invitationId: capability.invitationId };
  const data = await apiFetch<unknown>("/api/v1/invitations/accept", {
    token,
    method: "POST",
    body,
  });
  return AcceptInvitationResultSchema.parse(data);
}

export async function previewInvitation(
  token: string,
  capability: { inviteToken: string } | { invitationId: string },
): Promise<InvitationPreview> {
  const body =
    "inviteToken" in capability
      ? { token: capability.inviteToken }
      : { invitationId: capability.invitationId };
  const data = await apiFetch<unknown>("/api/v1/invitations/preview", {
    token,
    method: "POST",
    body,
  });
  return InvitationPreviewSchema.parse(data);
}
