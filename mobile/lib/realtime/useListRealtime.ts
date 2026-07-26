import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useIsFocused } from "expo-router";
import type { TFunction } from "i18next";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { DataSyncEngine } from "@/features/data-sync-engine";
import { useMe } from "@/features/auth/useMe";
import type { ShoppingEvent } from "@/features/shopping-item/schemas";
import type { WorkspaceMember } from "@/features/workspace/schemas";

import { showRemoteChangeToast } from "./remote-change-toast-store";
import {
  subscribeListEvents,
  type PollCadence,
} from "./subscription";

type Options = {
  workspaceId?: string | null;
  enabled?: boolean;
  /**
   * `shopping` uses a quieter poll cadence (~12–15s) while keeping
   * asymmetric remote edits discoverable. Default keeps 3/5/10s adaptive.
   */
  cadence?: PollCadence;
};

function resolveActorName(
  actorUserId: string,
  members: WorkspaceMember[] | undefined,
  someone: string,
): string {
  const member = members?.find((m) => m.userId === actorUserId);
  const name = member?.displayName?.trim();
  return name || someone;
}

function toastMessageForBatch(
  events: ShoppingEvent[],
  meId: string | undefined,
  members: WorkspaceMember[] | undefined,
  t: TFunction,
): string | null {
  const remote = events.filter((e) => e.actorUserId !== meId);
  if (remote.length === 0) return null;

  const someone = t("realtime.someone");
  const actorId = remote[0]?.actorUserId ?? "";
  const name = resolveActorName(actorId, members, someone);

  if (remote.some((e) => e.type === "ai_applied")) {
    return t("realtime.remoteListUpdated", { name });
  }

  const created = remote.filter((e) => e.type === "item_created").length;
  if (created > 0) {
    return t("realtime.remoteItemsAdded", { name, count: created });
  }

  return null;
}

/**
 * Subscribe to adaptive event polling while this screen is focused.
 * Blur (e.g. Home under a retained stack) unsubscribes; RN Modal sheets do not
 * blur the route, so they do not churn subscribe/unsubscribe.
 * Mount {@link RemoteChangeToast} on the same screen for presentation.
 *
 * Local-first: own event echoes never trigger items refresh — only remote
 * batches call {@link DataSyncEngine.requestItemsRefresh}.
 */
export function useListRealtime(
  listId: string | null,
  options: Options = {},
): void {
  const { workspaceId = null, enabled = true, cadence = "default" } = options;
  const isFocused = useIsFocused();
  const { getToken, isSignedIn } = useAuth();
  const me = useMe(Boolean(isSignedIn));
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const meIdRef = useRef(me.data?.id);
  meIdRef.current = me.data?.id;
  const workspaceIdRef = useRef(workspaceId);
  workspaceIdRef.current = workspaceId;
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (!enabled || !listId || !isSignedIn || !isFocused) return;

    return subscribeListEvents({
      listId,
      getToken,
      cadence,
      onBatch: (events, meta) => {
        if (meta.bootstrap) return;

        const meId = meIdRef.current;
        const hasRemote = events.some((e) => e.actorUserId !== meId);

        // Own echoes: advance cursor only (already done in poller) — no GET.
        if (hasRemote) {
          DataSyncEngine.requestItemsRefresh(meta.listId);
        }

        const members = workspaceIdRef.current
          ? queryClient.getQueryData<WorkspaceMember[]>([
              "workspace-members",
              workspaceIdRef.current,
            ])
          : undefined;

        const message = toastMessageForBatch(
          events,
          meId,
          members,
          tRef.current,
        );
        if (message) {
          showRemoteChangeToast(message);
        }
      },
    });
  }, [enabled, listId, isSignedIn, isFocused, getToken, queryClient, cadence]);
}
