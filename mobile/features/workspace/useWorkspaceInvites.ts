import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createInvitation,
  listInvitations,
  removeWorkspaceMember,
  revokeInvitation,
  updateWorkspaceMemberRole,
} from "./api";
import type { Invitation } from "./schemas";

export function useWorkspaceInvitations(
  workspaceId: string | null,
  enabled = true,
) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["workspace-invitations", workspaceId],
    enabled: enabled && Boolean(isSignedIn) && Boolean(workspaceId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) {
        throw new Error("Missing auth token or workspace id");
      }
      return listInvitations(token, workspaceId);
    },
  });
}

export function useCreateInvitation(workspaceId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return createInvitation(token, workspaceId, { email });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["workspace-invitations", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
    },
  });
}

export function useRevokeInvitation(workspaceId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      await revokeInvitation(token, workspaceId, invitationId);
    },
    onMutate: async (invitationId) => {
      await queryClient.cancelQueries({
        queryKey: ["workspace-invitations", workspaceId],
      });
      const previous = queryClient.getQueryData<Invitation[]>([
        "workspace-invitations",
        workspaceId,
      ]);
      queryClient.setQueryData<Invitation[]>(
        ["workspace-invitations", workspaceId],
        (prev) => prev?.filter((inv) => inv.id !== invitationId) ?? [],
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(
          ["workspace-invitations", workspaceId],
          ctx.previous,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ["workspace-invitations", workspaceId],
      });
    },
  });
}

export function useRemoveMember(workspaceId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      await removeWorkspaceMember(token, workspaceId, userId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useUpdateMemberRole(workspaceId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string; role: "admin" | "member" }) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      await updateWorkspaceMemberRole(
        token,
        workspaceId,
        input.userId,
        input.role,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
    },
  });
}
