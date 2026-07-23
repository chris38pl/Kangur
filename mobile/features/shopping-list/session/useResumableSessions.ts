import { useQuery } from "@tanstack/react-query";

import { ShoppingSession } from "./shopping-session";
import type { SessionSnapshot } from "./types";

type SessionQueryOptions = {
  refetchOnMount?: boolean | "always";
  refetchOnWindowFocus?: boolean | "always";
};

/** Resumable shopping sessions for Home Continue card. */
export function useResumableSessions(
  enabled = true,
  options?: SessionQueryOptions,
) {
  return useQuery({
    queryKey: ["shopping-sessions", "resumable"],
    enabled,
    refetchOnMount: options?.refetchOnMount,
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
    queryFn: async (): Promise<SessionSnapshot[]> => {
      return ShoppingSession.listResumable();
    },
    staleTime: 30_000,
  });
}
