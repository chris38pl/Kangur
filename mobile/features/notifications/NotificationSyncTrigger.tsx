import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import {
  refreshResumableSessions,
  refreshWorkspaceListIndex,
} from "@/features/shopping-list/refresh-workspace-list-index";

import { refreshNotifications } from "./refreshNotifications";

const LIST_INDEX_PAYLOAD_TYPES = new Set(["LIST", "SHOPPING"]);

function workspaceIdFromPushData(
  data: Record<string, unknown> | undefined,
): string | null {
  const payload = data?.payload;
  if (!payload || typeof payload !== "object") return null;
  const workspaceId = (payload as { workspaceId?: unknown }).workspaceId;
  return typeof workspaceId === "string" && workspaceId.length > 0
    ? workspaceId
    : null;
}

type Props = {
  /** When false (signed out), no listeners / refreshes. */
  enabled: boolean;
};

/**
 * App-level notification data sync triggers.
 * Badge always comes from GET /notifications — push is only one refresh trigger.
 */
export function NotificationSyncTrigger({ enabled }: Props) {
  const queryClient = useQueryClient();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!enabled) return;

    const onChange = (next: AppStateStatus) => {
      const wasBackground =
        appState.current === "background" || appState.current === "inactive";
      appState.current = next;
      if (wasBackground && next === "active") {
        void refreshNotifications(queryClient);
      }
    };

    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [enabled, queryClient]);

  useEffect(() => {
    if (!enabled) return;

    const sub = Notifications.addNotificationReceivedListener((notification) => {
      void refreshNotifications(queryClient);
      const data = notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      const payloadType = data?.payloadType;
      if (
        typeof payloadType !== "string" ||
        !LIST_INDEX_PAYLOAD_TYPES.has(payloadType)
      ) {
        return;
      }
      const workspaceId =
        workspaceIdFromPushData(data) ??
        queryClient.getQueryData<string | null>(["active-workspace-id"]) ??
        null;
      void refreshWorkspaceListIndex(queryClient, workspaceId);
      if (payloadType === "SHOPPING") {
        void refreshResumableSessions(queryClient);
      }
    });
    return () => sub.remove();
  }, [enabled, queryClient]);

  return null;
}
