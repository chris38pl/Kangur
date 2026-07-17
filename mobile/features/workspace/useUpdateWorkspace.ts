import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateWorkspace } from "./api";

export function useUpdateWorkspace() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      workspaceId: string;
      name?: string;
      icon?: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Missing Clerk token");
      const { workspaceId, ...body } = input;
      return updateWorkspace(token, workspaceId, body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}
