import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { refreshNotifications } from "./refreshNotifications";

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

    const sub = Notifications.addNotificationReceivedListener(() => {
      void refreshNotifications(queryClient);
    });
    return () => sub.remove();
  }, [enabled, queryClient]);

  return null;
}
