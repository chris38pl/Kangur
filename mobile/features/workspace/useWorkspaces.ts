import { useAuth } from "@clerk/clerk-expo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import {
  ADMIN_BROWSING_WORKSPACE_QUERY_KEY,
  useAdminBrowsingWorkspaceId,
} from "@/features/platform-workspaces/admin-browsing";
import { getPlatformWorkspaceDetail } from "@/features/platform-workspaces/api";
import { ApiClientError } from "@/lib/api/client";
import { persistWorkspacesCache } from "@/lib/query/persist-bootstrap";

import { listWorkspaces } from "./api";
import type { Workspace } from "./schemas";

export function useWorkspaces(enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const { browsingId, setBrowsingId } = useAdminBrowsingWorkspaceId();

  const membershipsQuery = useQuery({
    queryKey: ["workspaces"],
    enabled: enabled && Boolean(isSignedIn),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing Clerk token");
      const data = await listWorkspaces(token);
      void persistWorkspacesCache(data);
      return data;
    },
    retry: (failureCount, error) => {
      if (
        error instanceof ApiClientError &&
        (error.code === "INVALID_TOKEN" ||
          error.code === "TOKEN_EXPIRED" ||
          error.code === "AUTH_REQUIRED" ||
          error.code === "RATE_LIMITED" ||
          error.status === 401 ||
          error.status === 429)
      ) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const overlayQuery = useQuery({
    queryKey: [...ADMIN_BROWSING_WORKSPACE_QUERY_KEY, browsingId],
    enabled:
      enabled &&
      Boolean(isSignedIn) &&
      Boolean(browsingId) &&
      !(membershipsQuery.data ?? []).some((w) => w.id === browsingId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !browsingId) throw new Error("Missing token or browsing id");
      return getPlatformWorkspaceDetail(token, browsingId);
    },
    retry: (failureCount, error) => {
      // Stale admin-browsing id on a non-admin account → stop hammering.
      if (
        error instanceof ApiClientError &&
        (error.code === "FORBIDDEN" || error.status === 403)
      ) {
        return false;
      }
      return failureCount < 1;
    },
  });

  // Drop leftover platform-browse overlay when current user cannot access it.
  useEffect(() => {
    if (!browsingId || !overlayQuery.isError) return;
    const err = overlayQuery.error;
    if (
      !(err instanceof ApiClientError) ||
      (err.code !== "FORBIDDEN" && err.status !== 403)
    ) {
      return;
    }
    void setBrowsingId(null);
    queryClient.removeQueries({
      queryKey: ADMIN_BROWSING_WORKSPACE_QUERY_KEY,
    });
  }, [
    browsingId,
    overlayQuery.isError,
    overlayQuery.error,
    setBrowsingId,
    queryClient,
  ]);

  const data = useMemo((): Workspace[] | undefined => {
    if (!membershipsQuery.data) return membershipsQuery.data;
    const overlay = overlayQuery.data;
    if (!overlay) return membershipsQuery.data;
    if (membershipsQuery.data.some((w) => w.id === overlay.id)) {
      return membershipsQuery.data;
    }
    return [overlay, ...membershipsQuery.data];
  }, [membershipsQuery.data, overlayQuery.data]);

  const overlayPending =
    Boolean(browsingId) &&
    overlayQuery.isPending &&
    !(membershipsQuery.data ?? []).some((w) => w.id === browsingId);

  return {
    ...membershipsQuery,
    data,
    isPending: membershipsQuery.isPending || overlayPending,
  };
}
