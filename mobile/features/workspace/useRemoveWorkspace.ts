import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteWorkspace, leaveWorkspace } from "./api";
import type { Workspace } from "./schemas";
import {
  describeRemovalFailure,
  pickNextWorkspaceId,
  queryKeyMentionsWorkspace,
  type WorkspaceRemovalMode,
} from "./workspace-removal";

type RemoveInput = { workspaceId: string; mode: WorkspaceRemovalMode };

export type RemoveWorkspaceResult = {
  /** The API said 404: removed elsewhere already. Same cleanup, other toast. */
  alreadyGone: boolean;
};

/**
 * Delete (owner) or leave (others), then move the app off that workspace:
 * switch the active id first so no screen keeps fetching the removed id,
 * refetch the list, drop every cached query keyed by it.
 */
export function useRemoveWorkspace(options: {
  setActiveId: (id: string) => Promise<void>;
}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { setActiveId } = options;

  return useMutation({
    mutationFn: async ({
      workspaceId,
      mode,
    }: RemoveInput): Promise<RemoveWorkspaceResult> => {
      const token = await getToken();
      if (!token) throw new Error("Missing Clerk token");

      let alreadyGone = false;
      try {
        if (mode === "delete") {
          await deleteWorkspace(token, workspaceId);
        } else {
          await leaveWorkspace(token, workspaceId);
        }
      } catch (error) {
        if (describeRemovalFailure(error).kind !== "not_found") throw error;
        alreadyGone = true;
      }

      const before = queryClient.getQueryData<Workspace[]>(["workspaces"]);
      const nextId = pickNextWorkspaceId(before, workspaceId);
      if (nextId) await setActiveId(nextId);

      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });

      if (!nextId) {
        // Leaving the last workspace: the server just created a default one.
        const after = queryClient.getQueryData<Workspace[]>(["workspaces"]);
        const fallbackId = pickNextWorkspaceId(after, workspaceId);
        if (fallbackId) await setActiveId(fallbackId);
      }

      queryClient.removeQueries({
        predicate: (query) =>
          queryKeyMentionsWorkspace(query.queryKey, workspaceId),
      });

      return { alreadyGone };
    },
  });
}
