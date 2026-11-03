import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";

import {
  refreshResumableSessions,
  refreshWorkspaceListIndex,
  SHARED_WORKSPACE_LIST_POLL_MS,
} from "./refresh-workspace-list-index";

type Props = {
  /** When false (signed out), no listeners. */
  enabled: boolean;
};

/**
 * Keeps the home list index warm.
 * - Foreground: refresh lists + resumable sessions for the active workspace.
 * - Shared workspace (memberCount > 1): poll every ~12s while active.
 *
 * Does not fetch workspaces itself. Tab boot owns that request so this hook
 * cannot race /me. It only watches the cache those screens already fill.
 */
export function WorkspaceListIndexSync({ enabled }: Props) {
  const queryClient = useQueryClient();
  const workspacesQuery = useWorkspaces(false);
  const { activeWorkspace, hydrated, queryWorkspaceId } = useActiveWorkspace(
    workspacesQuery.data,
  );
  const workspaceId = enabled ? queryWorkspaceId : null;
  const shared =
    enabled && hydrated && (activeWorkspace?.memberCount ?? 0) > 1;

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const onChange = (next: AppStateStatus) => {
      if (next !== "active") return;
      void refreshWorkspaceListIndex(queryClient, workspaceId);
      void refreshResumableSessions(queryClient);
    };

    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [enabled, queryClient, workspaceId]);

  useEffect(() => {
    if (!shared || !workspaceId) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (AppState.currentState !== "active") return;
      void refreshWorkspaceListIndex(queryClient, workspaceId);
      void refreshResumableSessions(queryClient);
    };

    const start = () => {
      if (timer) return;
      timer = setInterval(tick, SHARED_WORKSPACE_LIST_POLL_MS);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    if (AppState.currentState === "active") {
      start();
      tick();
    }

    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") start();
      else stop();
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [queryClient, shared, workspaceId]);

  return null;
}
