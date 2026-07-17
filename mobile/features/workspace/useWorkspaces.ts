import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

import { listWorkspaces } from "./api";

export function useWorkspaces(enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["workspaces"],
    enabled: enabled && Boolean(isSignedIn),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing Clerk token");
      return listWorkspaces(token);
    },
  });
}
