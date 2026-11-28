import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { MeUser } from "@/features/auth/useMe";
import { Analytics } from "@/lib/analytics";
import type { NamePromptPlace } from "@shared/analytics/events";

import { updateMeDisplayName } from "./api";

/**
 * Saves the name other people see. The household sees it at once: members and the join
 * screen read it from the server.
 */
export function useUpdateDisplayName(place: NamePromptPlace) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (displayName: string | null): Promise<MeUser> => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return updateMeDisplayName(token, displayName);
    },
    onSuccess: (me) => {
      queryClient.setQueryData(["me"], me);
      void queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
      Analytics.track("name_saved", { place });
    },
  });
}
