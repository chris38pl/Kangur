import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ClerkSessionRow = {
  id: string;
  isCurrent: boolean;
  /** Display title (device / browser) */
  title: string;
  /** Raw activity fields for UI formatting */
  browserName: string | null;
  deviceType: string | null;
  city: string | null;
  country: string | null;
  lastActiveAt: string | null;
  isMobile: boolean | null;
};

function asIso(value: Date | string | number | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

type ActivityLike = {
  browserName?: string | null;
  deviceType?: string | null;
  city?: string | null;
  country?: string | null;
  isMobile?: boolean | null;
};

type SessionLike = {
  id: string;
  lastActiveAt?: Date | string | number | null;
  latestActivity?: ActivityLike | null;
  revoke: () => Promise<unknown>;
};

function mapSession(
  session: SessionLike,
  currentSessionId: string | null | undefined,
): ClerkSessionRow {
  const activity = session.latestActivity ?? null;
  return {
    id: session.id,
    isCurrent: Boolean(currentSessionId && session.id === currentSessionId),
    title: "",
    browserName: activity?.browserName ?? null,
    deviceType: activity?.deviceType ?? null,
    city: activity?.city ?? null,
    country: activity?.country ?? null,
    lastActiveAt: asIso(session.lastActiveAt),
    isMobile: activity?.isMobile ?? null,
  };
}

export function clerkSessionsQueryKey(userId: string | null | undefined) {
  return ["clerk-sessions", userId ?? "anon"] as const;
}

/**
 * Clerk auth sessions for Privacy screen.
 * No Prisma — identity-provider data only.
 */
export function useClerkSessions() {
  const { user, isLoaded } = useUser();
  const { sessionId } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: clerkSessionsQueryKey(userId),
    enabled: isLoaded && Boolean(user),
    queryFn: async (): Promise<ClerkSessionRow[]> => {
      if (!user) return [];
      const sessions = (await user.getSessions()) as SessionLike[];
      const rows = sessions.map((s) => mapSession(s, sessionId));
      rows.sort((a, b) => {
        if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
        const aAt = a.lastActiveAt ? Date.parse(a.lastActiveAt) : 0;
        const bAt = b.lastActiveAt ? Date.parse(b.lastActiveAt) : 0;
        return bAt - aAt;
      });
      return rows;
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: clerkSessionsQueryKey(userId),
    });

  const revokeOne = useMutation({
    mutationFn: async (targetSessionId: string) => {
      if (!user) throw new Error("No user");
      if (targetSessionId === sessionId) {
        throw new Error("Cannot revoke current session");
      }
      const sessions = (await user.getSessions()) as SessionLike[];
      const target = sessions.find((s) => s.id === targetSessionId);
      if (!target) throw new Error("Session not found");
      await target.revoke();
    },
    onSuccess: () => {
      void invalidate();
    },
  });

  const revokeOthers = useMutation({
    mutationFn: async (): Promise<{ ok: number; total: number }> => {
      if (!user) throw new Error("No user");
      const sessions = (await user.getSessions()) as SessionLike[];
      const others = sessions.filter((s) => s.id !== sessionId);
      if (others.length === 0) return { ok: 0, total: 0 };
      const results = await Promise.allSettled(
        others.map((s) => s.revoke()),
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      return { ok, total: others.length };
    },
    onSuccess: () => {
      void invalidate();
    },
  });

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading || !isLoaded,
    isError: query.isError,
    refetch: query.refetch,
    invalidate,
    revokeOne,
    revokeOthers,
  };
}
