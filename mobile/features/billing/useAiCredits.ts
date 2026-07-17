import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

import { getAiCredits } from "./api";

export function useAiCredits(workspaceId: string | null | undefined) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["ai-credits", workspaceId],
    enabled: Boolean(isSignedIn && workspaceId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) {
        throw new Error("Missing auth token or workspace.");
      }
      return getAiCredits(token, workspaceId);
    },
  });
}
