import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { registerPushDevice } from "./api";
import { navigateFromNotification } from "./navigate";
import {
  normalizePermissionStatus,
  setStoredPushPermissionStatus,
} from "./push-permission";
import type { AppNotification } from "./schemas";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function platform(): "ios" | "android" {
  return Platform.OS === "ios" ? "ios" : "android";
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function notificationFromPushData(
  id: string,
  data: Record<string, unknown>,
): AppNotification | null {
  const payloadType = data.payloadType;
  if (typeof payloadType !== "string") return null;

  return {
    id:
      typeof data.notificationId === "string" ? data.notificationId : id,
    type: "SHOPPING_STARTED",
    status: "READ",
    title: "",
    body: "",
    actorUserId: null,
    workspaceId: null,
    sourceId: null,
    payloadType: payloadType as AppNotification["payloadType"],
    payloadSchemaVersion:
      typeof data.payloadSchemaVersion === "number"
        ? data.payloadSchemaVersion
        : 1,
    payload: data.payload,
    createdAt: new Date().toISOString(),
    readAt: new Date().toISOString(),
  };
}

/**
 * Registers Expo push token after sign-in and handles notification taps.
 * OS permission denied is persisted — we do not re-prompt every cold start.
 */
export function usePushRegistration(enabled: boolean) {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const lastResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !isSignedIn) return;

    let cancelled = false;

    const run = async () => {
      try {
        if (!Device.isDevice) {
          console.info("[notifications]", "PushRegisterSkipped", {
            reason: "no-device",
          });
          return;
        }

        await ensureAndroidChannel();

        const { status: existing } =
          await Notifications.getPermissionsAsync();
        let finalStatus = normalizePermissionStatus(existing);
        await setStoredPushPermissionStatus(finalStatus);

        if (finalStatus === "denied") {
          console.info("[notifications]", "PushRegisterSkipped", {
            reason: "permission-denied",
          });
          return;
        }

        if (finalStatus === "undetermined") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = normalizePermissionStatus(status);
          await setStoredPushPermissionStatus(finalStatus);
        }

        if (finalStatus !== "granted" || cancelled) {
          console.info("[notifications]", "PushRegisterSkipped", {
            reason:
              finalStatus === "denied"
                ? "permission-denied"
                : "permission-undetermined",
          });
          return;
        }

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
        const push = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );

        const token = await getToken();
        if (!token || cancelled) return;

        await registerPushDevice(token, {
          expoToken: push.data,
          platform: platform(),
          appVersion: Constants.expoConfig?.version,
        });
      } catch (error) {
        console.info("[notifications]", "PushRegisterSkipped", {
          reason: "error",
          error,
        });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, isSignedIn, getToken]);

  useEffect(() => {
    const handleResponse = (
      response: Notifications.NotificationResponse,
    ) => {
      const id = response.notification.request.identifier;
      if (lastResponseId.current === id) return;
      lastResponseId.current = id;

      const data = response.notification.request.content.data as Record<
        string,
        unknown
      >;
      const synthetic = notificationFromPushData(id, data ?? {});
      if (!synthetic) return;
      navigateFromNotification(router, synthetic);
    };

    const sub = Notifications.addNotificationResponseReceivedListener(
      handleResponse,
    );

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    return () => sub.remove();
  }, [router]);
}
