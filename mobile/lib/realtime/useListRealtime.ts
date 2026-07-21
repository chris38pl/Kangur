import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useMe } from "@/features/auth/useMe";
import type { ShoppingEvent } from "@/features/shopping-item/schemas";
import type { WorkspaceMember } from "@/features/workspace/schemas";

import { scheduleItemsRefresh } from "./scheduleItemsRefresh";
import { showRemoteChangeToast } from "./remote-change-toast-store";
import { subscribeListEvents } from "./subscription";

type Options = {
  workspaceId?: string | null;
  enabled?: boolean;
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
 * Subscribe to adaptive event polling while this screen is mounted.
 * Mount {@link RemoteChangeToast} on the same screen for presentation.
 */
export function useListRealtime(
  listId: string | null,
  options: Options = {},
): void {
  const { workspaceId = null, enabled = true } = options;
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
    if (!enabled || !listId || !isSignedIn) return;

    return subscribeListEvents({
      listId,
      getToken,
      onBatch: (events, meta) => {
        if (meta.bootstrap) return;

        scheduleItemsRefresh(queryClient, meta.listId);

        const members = workspaceIdRef.current
          ? queryClient.getQueryData<WorkspaceMember[]>([
              "workspace-members",
              workspaceIdRef.current,
            ])
          : undefined;

        const message = toastMessageForBatch(
          events,
          meIdRef.current,
          members,
          tRef.current,
        );
        if (message) {
          showRemoteChangeToast(message);
        }
      },
    });
  }, [enabled, listId, isSignedIn, getToken, queryClient]);
}
