import { useQuery } from "@tanstack/react-query";

import { ShoppingSession } from "./shopping-session";
import type { SessionSnapshot } from "./types";

/** Resumable shopping sessions for Home Continue card. */
export function useResumableSessions(enabled = true) {
  return useQuery({
    queryKey: ["shopping-sessions", "resumable"],
    enabled,
    queryFn: async (): Promise<SessionSnapshot[]> => {
      return ShoppingSession.listResumable();
    },
    staleTime: 5_000,
  });
}
