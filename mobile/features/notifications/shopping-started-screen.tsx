import { getWorkspaceIconEmoji } from "@shared/workspace-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import {
  listNotifications,
  markNotificationRead,
} from "@/features/notifications/api";
import { formatNotificationTime } from "@/features/notifications/format-time";
import type { AppNotification } from "@/features/notifications/schemas";
import { NOTIFICATIONS_QUERY_KEY } from "@/features/notifications/useNotifications";

type ShoppingStartedPayload = {
  listId?: string;
  listName?: string;
  listEmoji?: string;
  sessionId?: string;
  workspaceId?: string;
  workspaceName?: string;
  workspaceIcon?: string;
  actorDisplayName?: string;
  screen?: string;
};

function paramString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return typeof value === "string" ? value : "";
}

export function ShoppingStartedNotificationScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ notificationId?: string | string[] }>();
  const notificationId = paramString(params.notificationId);

  const [notification, setNotification] = useState<AppNotification | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!notificationId) {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
        return;
      }

      const cached = queryClient.getQueryData<{
        notifications: AppNotification[];
      }>(NOTIFICATIONS_QUERY_KEY);
      const fromCache = cached?.notifications.find(
        (n) => n.id === notificationId,
      );
      if (fromCache) {
        if (!cancelled) {
          setNotification(fromCache);
          setLoading(false);
        }
        return;
      }

      try {
        const token = await getToken();
        if (!token || cancelled) {
          if (!cancelled) {
            setError(true);
            setLoading(false);
          }
          return;
        }
        const list = await listNotifications(token);
        const found = list.notifications.find((n) => n.id === notificationId);
        if (!cancelled) {
          if (found) setNotification(found);
          else setError(true);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [notificationId, getToken, queryClient]);

  const payload = (notification?.payload ?? {}) as ShoppingStartedPayload;
  const listId = payload.listId ?? "";
  const listName = payload.listName || notification?.body || "";
  const workspaceName = payload.workspaceName || "";
  const workspaceIcon = payload.workspaceIcon || "home";
  const emoji = getWorkspaceIconEmoji(workspaceIcon) ?? "🏠";
  const headline =
    notification?.title ||
    t("notifications.shoppingStartedFallbackTitle");

  const markRead = useCallback(async () => {
    if (!notificationId) return;
    try {
      const token = await getToken();
      if (!token) return;
      await markNotificationRead(token, notificationId);
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    } catch {
      // best-effort
    }
  }, [getToken, notificationId, queryClient]);

  const goHome = useCallback(() => {
    router.replace("/(tabs)" as never);
  }, [router]);

  const onBack = () => {
    void markRead();
    goHome();
  };

  const onMarkRead = async () => {
    setMarking(true);
    await markRead();
    setMarking(false);
    goHome();
  };

  const onOpenList = async () => {
    await markRead();
    if (listId) {
      // List detail - not /shop (entering shop would start B's session and notify A).
      router.replace(`/list/${listId}` as never);
    } else {
      goHome();
    }
  };

  return (
    <Screen style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[2],
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BackIcon size={20} />
        </Pressable>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : error || !notification ? (
        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing[6],
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              ...typography.title,
              color: theme.text,
              textAlign: "center",
            }}
          >
            {t("notifications.detailMissingTitle")}
          </Text>
          <Pressable
            onPress={goHome}
            style={{
              marginTop: spacing[6],
              alignSelf: "stretch",
              backgroundColor: theme.primary,
              borderRadius: radius.full,
              paddingVertical: spacing[4],
              alignItems: "center",
            }}
          >
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("invite.goHome")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing[6],
            paddingBottom: spacing[6] + insets.bottom,
            alignItems: "center",
            flexGrow: 1,
          }}
        >
          <Image
            source={brandAssets.shoppingStarted}
            style={{ width: 220, height: 220, resizeMode: "contain" }}
            accessibilityLabel=""
          />

          <View
            style={{
              marginTop: spacing[3],
              backgroundColor: theme.section,
              borderRadius: radius.full,
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[1] + 2,
            }}
          >
            <Text style={{ ...typography.caption, color: theme.textBody }}>
              {formatNotificationTime(notification.createdAt, i18n.language)}
            </Text>
          </View>

          <Text
            style={{
              ...typography.title,
              fontSize: 22,
              lineHeight: 30,
              color: theme.text,
              textAlign: "center",
              marginTop: spacing[4],
              paddingHorizontal: spacing[2],
            }}
          >
            {headline}
          </Text>

          {listName ? (
            <Text
              style={{
                ...typography.body,
                color: theme.textMuted,
                textAlign: "center",
                marginTop: spacing[2],
              }}
            >
              {listName}
            </Text>
          ) : null}

          <View
            style={{
              width: "100%",
              marginTop: spacing[5],
              backgroundColor: theme.section,
              borderRadius: radius.xl,
              padding: spacing[4],
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing[3],
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.sm,
                  backgroundColor: theme.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Text style={{ fontSize: 22 }}>{emoji}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0, justifyContent: "center" }}>
                <Text
                  style={{
                    ...typography.headline,
                    fontSize: 16,
                    lineHeight: 20,
                    color: theme.text,
                  }}
                  numberOfLines={1}
                >
                  {t("notifications.shoppingStartedInWorkspace", {
                    name: workspaceName || t("invite.thisWorkspace"),
                  })}
                </Text>
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textBody,
                    marginTop: 2,
                    lineHeight: 16,
                  }}
                  numberOfLines={2}
                >
                  {t("notifications.shoppingStartedCardBody", {
                    name: payload.actorDisplayName || "…",
                  })}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => void onOpenList()}
            style={{
              marginTop: spacing[8],
              alignSelf: "stretch",
              backgroundColor: theme.primary,
              borderRadius: radius.full,
              paddingVertical: spacing[4],
              alignItems: "center",
            }}
          >
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("notifications.openList")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void onMarkRead()}
            disabled={marking}
            hitSlop={8}
            style={{ marginTop: spacing[4], paddingVertical: spacing[2] }}
          >
            {marking ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <Text
                style={{
                  ...typography.label,
                  color: theme.primary,
                  textAlign: "center",
                }}
              >
                {t("notifications.markAsRead")}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}
