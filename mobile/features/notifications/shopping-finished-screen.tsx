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

type ShoppingFinishedPayload = {
  listId?: string;
  listName?: string;
  listEmoji?: string;
  sessionId?: string;
  screen?: string;
  unavailableCount?: number;
  boughtCount?: number;
  itemCount?: number;
  workspaceId?: string;
  workspaceName?: string;
  workspaceIcon?: string;
  actorDisplayName?: string;
};

function paramString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return typeof value === "string" ? value : "";
}

function CartIcon({ color, size = 22 }: { color: string; size?: number }) {
  const stroke = Math.max(1.6, size * 0.09);
  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      <View
        style={{
          width: size * 0.62,
          height: size * 0.42,
          borderWidth: stroke,
          borderColor: color,
          borderRadius: 3,
          marginTop: size * 0.22,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: size * 0.08,
          left: size * 0.12,
          width: size * 0.28,
          height: size * 0.22,
          borderLeftWidth: stroke,
          borderTopWidth: stroke,
          borderColor: color,
          borderTopLeftRadius: 4,
          transform: [{ rotate: "-18deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: size * 0.22,
          width: size * 0.14,
          height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          right: size * 0.18,
          width: size * 0.14,
          height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export function ShoppingFinishedNotificationScreen() {
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

  const payload = (notification?.payload ?? {}) as ShoppingFinishedPayload;
  const listId = payload.listId ?? "";
  const listName = payload.listName || "";
  const itemCount =
    typeof payload.itemCount === "number" ? payload.itemCount : 0;
  const boughtCount =
    typeof payload.boughtCount === "number" ? payload.boughtCount : 0;
  const unavailableCount =
    typeof payload.unavailableCount === "number"
      ? payload.unavailableCount
      : 0;
  const progress = itemCount > 0 ? Math.min(1, boughtCount / itemCount) : 0;

  const subtitle =
    unavailableCount > 0
      ? t("notifications.shoppingFinishedUnavailable", {
          count: unavailableCount,
        })
      : t("notifications.shoppingFinishedAllBought");

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

  const onOpenSummary = async () => {
    await markRead();
    if (!listId) {
      goHome();
      return;
    }
    const q = new URLSearchParams({ viewer: "1" });
    if (payload.actorDisplayName) {
      q.set("actor", payload.actorDisplayName);
    }
    router.replace(
      `/list/${listId}/shop/finish?${q.toString()}` as never,
    );
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
            source={brandAssets.shoppingFinished}
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
            {notification.title}
          </Text>

          <Text
            style={{
              ...typography.body,
              color: theme.textMuted,
              textAlign: "center",
              marginTop: spacing[2],
            }}
          >
            {subtitle}
          </Text>

          <View
            style={{
              width: "100%",
              marginTop: spacing[5],
              backgroundColor: theme.surface,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: theme.border,
              padding: spacing[4],
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: spacing[3],
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.sm,
                  backgroundColor: "#E4F0FB",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CartIcon color="#4A7FB5" size={22} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: spacing[2],
                  }}
                >
                  <Text
                    style={{
                      ...typography.headline,
                      color: theme.text,
                      flex: 1,
                    }}
                    numberOfLines={2}
                  >
                    {listName || t("notifications.shoppingFinishedListFallback")}
                  </Text>
                  {itemCount > 0 ? (
                    <Text
                      style={{
                        ...typography.caption,
                        color: theme.text,
                        fontWeight: "600",
                      }}
                    >
                      {t("notifications.shoppingFinishedBoughtRatio", {
                        bought: boughtCount,
                        total: itemCount,
                      })}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                    marginTop: 2,
                  }}
                >
                  {t("notifications.productCount", { count: itemCount })}
                </Text>
              </View>
            </View>

            <View
              style={{
                marginTop: spacing[3],
                height: 8,
                borderRadius: radius.full,
                backgroundColor: theme.section,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  height: "100%",
                  backgroundColor: theme.primary,
                  borderRadius: radius.full,
                }}
              />
            </View>
          </View>

          <Pressable
            onPress={() => void onOpenSummary()}
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
              {t("notifications.viewSummary")}
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
