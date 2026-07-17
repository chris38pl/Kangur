import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

import { listWorkspaceMembers } from "./api";

export function useWorkspaceMembers(workspaceId: string | null, enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["workspace-members", workspaceId],
    enabled: enabled && Boolean(isSignedIn) && Boolean(workspaceId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) {
        throw new Error("Missing auth token or workspace id");
      }
      return listWorkspaceMembers(token, workspaceId);
    },
  });
}
