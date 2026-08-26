import type { QueryClient } from "@tanstack/react-query";

import type { AiCreditsBalance } from "./schemas";

export function aiCreditsQueryKey(workspaceId: string) {
  return ["ai-credits", workspaceId] as const;
}

/** Optimistic decrement so banners update before refetch completes. */
export function bumpAiCreditsOptimistic(
  queryClient: QueryClient,
  workspaceId: string,
  cost = 1,
) {
  queryClient.setQueryData<AiCreditsBalance>(
    aiCreditsQueryKey(workspaceId),
    (prev) => {
      if (!prev || prev.unlimited) return prev;
      const remaining =
        prev.remaining === null
          ? null
          : Math.max(0, prev.remaining - cost);
      return {
        ...prev,
        used: prev.used + cost,
        remaining,
      };
    },
  );
}

export function invalidateAiCredits(
  queryClient: QueryClient,
  workspaceId: string | null | undefined,
) {
  if (!workspaceId) return Promise.resolve();
  return queryClient.invalidateQueries({
    queryKey: aiCreditsQueryKey(workspaceId),
  });
}

export function refreshAiCredits(
  queryClient: QueryClient,
  workspaceId: string | null | undefined,
) {
  if (!workspaceId) return Promise.resolve();
  return queryClient.refetchQueries({
    queryKey: aiCreditsQueryKey(workspaceId),
  });
}
