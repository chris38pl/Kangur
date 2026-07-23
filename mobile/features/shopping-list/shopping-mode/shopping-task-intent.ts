import type { QueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

import { finishShoppingSession } from "@/features/notifications/api";
import { ShoppingSession } from "@/features/shopping-list/session/shopping-session";
import { Analytics } from "@/lib/analytics";
import { finishTask } from "@/lib/navigation";
type CompleteArgs = {
  listId: string;
  workspaceId?: string;
  itemCount: number;
  durationSec: number;
  unavailableCount: number;
  getToken: () => Promise<string | null>;
  queryClient: QueryClient;
};

/**
 * Shopping Task Intent — screens call this; navigation lives here.
 * Session state machine stays in ShoppingSession; Intent owns side effects.
 */
export async function completeShoppingTask(args: CompleteArgs): Promise<void> {
  const {
    listId,
    workspaceId,
    itemCount,
    durationSec,
    unavailableCount,
    getToken,
    queryClient,
  } = args;

  const snap = ShoppingSession.get(listId);
  const serverSessionId = snap?.serverSessionId;
  let archivedOnServer = false;

  if (serverSessionId) {
    try {
      const token = await getToken();
      if (token) {
        await finishShoppingSession(
          token,
          listId,
          serverSessionId,
          unavailableCount,
        );
        archivedOnServer = true;
      }
    } catch (error) {
      console.info("[shopping]", "ServerSessionFinishFailed", error);
    }
  }

  await ShoppingSession.finish(listId, { skipArchive: archivedOnServer });

  if (workspaceId) {
    Analytics.track("shopping_finished", {
      workspace_id: workspaceId,
      list_id: listId,
      item_count: itemCount,
      duration_sec: durationSec,
    });
    queryClient.setQueryData(
      ["shopping-lists", workspaceId],
      (prev: { id: string }[] | undefined) =>
        prev?.filter((l) => l.id !== listId) ?? prev,
    );
  }

  await queryClient.invalidateQueries({
    queryKey: workspaceId
      ? ["shopping-lists", workspaceId]
      : ["shopping-lists"],
  });
  await ShoppingSession.clearEnded(listId);
  finishTask();
}

/**
 * Leave Shopping Task UI without discarding the Session (still resumable).
 * Always land on the list editor — do not use stack back (resume from Home
 * has no list frame underneath).
 */
export function leaveShoppingTask(listId: string): void {
  router.replace(`/list/${listId}` as never);
}

/** Viewer / post-complete exit — clear Task frames and land on Root. */
export function dismissShoppingTask(): void {
  finishTask();
}
