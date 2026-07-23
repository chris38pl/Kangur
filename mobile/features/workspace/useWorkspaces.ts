import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useMe } from "@/features/auth/useMe";
import {
  ADMIN_BROWSING_WORKSPACE_QUERY_KEY,
  useAdminBrowsingWorkspaceId,
} from "@/features/platform-workspaces/admin-browsing";
import { getPlatformWorkspaceDetail } from "@/features/platform-workspaces/api";

import { listWorkspaces } from "./api";
import type { Workspace } from "./schemas";
import { persistWorkspacesCache } from "@/lib/query/persist-bootstrap";

export function useWorkspaces(enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  const meQuery = useMe();
  const isPlatformAdmin = meQuery.data?.platformRole === "ADMIN";
  const { browsingId } = useAdminBrowsingWorkspaceId();

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
  });

  const overlayQuery = useQuery({
    queryKey: [...ADMIN_BROWSING_WORKSPACE_QUERY_KEY, browsingId],
    enabled:
      enabled &&
      Boolean(isSignedIn) &&
      isPlatformAdmin &&
      Boolean(browsingId) &&
      !(membershipsQuery.data ?? []).some((w) => w.id === browsingId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !browsingId) throw new Error("Missing token or browsing id");
      return getPlatformWorkspaceDetail(token, browsingId);
    },
  });

  const data = useMemo((): Workspace[] | undefined => {
    if (!membershipsQuery.data) return membershipsQuery.data;
    const overlay = overlayQuery.data;
    if (!overlay) return membershipsQuery.data;
    if (membershipsQuery.data.some((w) => w.id === overlay.id)) {
      return membershipsQuery.data;
    }
    return [overlay, ...membershipsQuery.data];
  }, [membershipsQuery.data, overlayQuery.data]);

  return {
    ...membershipsQuery,
    data,
    isPending:
      membershipsQuery.isPending ||
      (Boolean(browsingId) &&
        isPlatformAdmin &&
        overlayQuery.isPending &&
        !(membershipsQuery.data ?? []).some((w) => w.id === browsingId)),
  };
}
