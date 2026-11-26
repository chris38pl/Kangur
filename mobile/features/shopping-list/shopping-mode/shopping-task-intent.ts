import type { QueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

import { DataSyncEngine } from "@/features/data-sync-engine";
import { ShoppingSession } from "@/features/shopping-list/session/shopping-session";
import { Analytics } from "@/lib/analytics";
import { finishTask } from "@/lib/navigation";

import { recordFinishedTripAndMaybeAskForReview } from "./review-prompt";
type CompleteArgs = {
  listId: string;
  workspaceId?: string;
  itemCount: number;
  durationSec: number;
  unavailableCount: number;
  /** Products marked bought on this trip (review prompt threshold). */
  boughtCount?: number;
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
    queryClient,
  } = args;

  // The finish goes through the sync queue behind this trip's ticks and
  // added items: archiving first would make them 404 on the archived list.
  // Sent now when there is signal, replayed later when there is not.
  await ShoppingSession.finish(listId, { unavailableCount });

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
  void recordFinishedTripAndMaybeAskForReview(
    args.boughtCount ?? Math.max(0, itemCount - unavailableCount),
  );
}

/**
 * Leave Shopping Task UI without discarding the Session (still resumable).
 * Always land on the list editor — do not use stack back (resume from Home
 * has no list frame underneath).
 */
export function leaveShoppingTask(listId: string): void {
  // Settled reconcile once on leave (queue idle → one GET).
  DataSyncEngine.reconcileIfSettled(listId);
  router.replace(`/list/${listId}` as never);
}

/** Viewer / post-complete exit — clear Task frames and land on Root. */
export function dismissShoppingTask(): void {
  finishTask();
}
