import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { registerPushDevice } from "./api";
import { navigateFromNotification } from "./navigate";
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

/**
 * Registers Expo push token after sign-in and handles notification taps idempotently.
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
        if (!Device.isDevice) return;

        const { status: existing } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted" || cancelled) return;

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
        console.info("[notifications]", "PushRegisterSkipped", error);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, isSignedIn, getToken]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const id = response.notification.request.identifier;
        if (lastResponseId.current === id) return;
        lastResponseId.current = id;

        const data = response.notification.request.content.data as {
          notificationId?: string;
          payloadType?: string;
          payloadSchemaVersion?: number;
          payload?: unknown;
        };

        if (!data?.payloadType) return;

        const synthetic: AppNotification = {
          id:
            typeof data.notificationId === "string"
              ? data.notificationId
              : id,
          type: "SHOPPING_STARTED",
          status: "READ",
          title: "",
          body: "",
          actorUserId: null,
          workspaceId: null,
          sourceId: null,
          payloadType: data.payloadType as AppNotification["payloadType"],
          payloadSchemaVersion: data.payloadSchemaVersion ?? 1,
          payload: data.payload,
          createdAt: new Date().toISOString(),
          readAt: new Date().toISOString(),
        };
        navigateFromNotification(router, synthetic);
      },
    );
    return () => sub.remove();
  }, [router]);
}
