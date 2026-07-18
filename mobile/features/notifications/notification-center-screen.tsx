import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
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
import { SymbolView } from "expo-symbols";

import {
  formatNotificationTime,
  notificationSectionKey,
  type NotificationSectionKey,
} from "./format-time";
import { navigateFromNotification } from "./navigate";
import {
  NotificationTypeIcon,
  visualForNotification,
} from "./notification-visuals";
import type { AppNotification } from "./schemas";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationPreferences,
  useNotifications,
} from "./useNotifications";

type FilterTab = "all" | "unread";

const SECTION_ORDER: NotificationSectionKey[] = ["today", "earlier"];
const HEADER_SIDE = 40;
const ICON_TILE = 44;

export function NotificationCenterScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const query = useNotifications();
  const prefsQuery = useNotificationPreferences();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const [tab, setTab] = useState<FilterTab>("all");

  const silentMode = prefsQuery.data?.silentMode === true;
  const unreadCount = silentMode ? 0 : (query.data?.unreadCount ?? 0);
  const allNotifications = silentMode
    ? []
    : (query.data?.notifications ?? []);
  const isEmpty = allNotifications.length === 0;

  const filtered = useMemo(() => {
    if (tab === "unread") {
      return allNotifications.filter((n) => n.status === "UNREAD");
    }
    return allNotifications;
  }, [allNotifications, tab]);

  const grouped = useMemo(() => {
    const map = new Map<NotificationSectionKey, AppNotification[]>();
    for (const key of SECTION_ORDER) map.set(key, []);
    for (const n of filtered) {
      map.get(notificationSectionKey(n.createdAt))?.push(n);
    }
    return map;
  }, [filtered]);

  const sectionTitle = (key: NotificationSectionKey) =>
    key === "today"
      ? t("notifications.groupToday")
      : t("notifications.groupEarlier");

  const onOpen = (notification: AppNotification) => {
    if (notification.status === "UNREAD") {
      markRead.mutate(notification.id);
    }
    navigateFromNotification(router, notification);
  };

  return (
    <Screen style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[3],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          style={{
            width: HEADER_SIDE,
            height: HEADER_SIDE,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BackIcon size={20} />
        </Pressable>
        <Text
          style={{
            ...typography.headline,
            color: theme.text,
            textAlign: "center",
            flex: 1,
          }}
          numberOfLines={1}
        >
          {t("notifications.centerTitle")}
        </Text>
        <Pressable
          onPress={() => router.push("/notifications" as never)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("notifications.settingsA11y")}
          style={{
            width: HEADER_SIDE,
            height: HEADER_SIDE,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SymbolView
            name={{
              ios: "gearshape",
              android: "tune",
              web: "tune",
            }}
            size={22}
            tintColor={theme.text}
            weight="medium"
            fallback={
              <Text style={{ fontSize: 20, color: theme.text, lineHeight: 22 }}>
                ⚙
              </Text>
            }
          />
        </Pressable>
      </View>

      {query.isPending ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : isEmpty ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing[4],
            paddingBottom: spacing[6] + insets.bottom,
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isPending}
              onRefresh={() => void query.refetch()}
              tintColor={theme.primary}
            />
          }
        >
          <View
            style={{
              alignItems: "center",
              paddingHorizontal: spacing[6],
              marginTop: -spacing[8],
            }}
          >
            <Image
              source={brandAssets.notificationsEmpty}
              style={{
                width: 220,
                height: 220,
                resizeMode: "contain",
              }}
              accessibilityLabel=""
            />
            <Text
              style={{
                ...typography.title,
                color: theme.text,
                marginTop: spacing[5],
                textAlign: "center",
              }}
            >
              {t("notifications.emptyTitle")}
            </Text>
            <Text
              style={{
                ...typography.body,
                color: theme.textMuted,
                marginTop: spacing[2],
                textAlign: "center",
              }}
            >
              {t("notifications.empty")}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: spacing[4],
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <FilterTabButton
              label={t("notifications.tabAll")}
              active={tab === "all"}
              onPress={() => setTab("all")}
              color={theme.primary}
              muted={theme.textMuted}
            />
            <FilterTabButton
              label={t("notifications.tabUnread")}
              badge={unreadCount > 0 ? unreadCount : undefined}
              active={tab === "unread"}
              onPress={() => setTab("unread")}
              color={theme.primary}
              muted={theme.textMuted}
            />
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing[4],
              paddingTop: spacing[4],
              paddingBottom:
                spacing[6] +
                insets.bottom +
                (unreadCount > 0 ? 72 : 0),
            }}
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching && !query.isPending}
                onRefresh={() => void query.refetch()}
                tintColor={theme.primary}
              />
            }
          >
            {filtered.length === 0 ? (
              <Text
                style={{
                  ...typography.body,
                  color: theme.textMuted,
                  textAlign: "center",
                  marginTop: spacing[10],
                }}
              >
                {t("notifications.emptyUnread")}
              </Text>
            ) : (
              SECTION_ORDER.map((key) => {
                const items = grouped.get(key) ?? [];
                if (items.length === 0) return null;
                return (
                  <View key={key} style={{ marginBottom: spacing[5] }}>
                    <Text
                      style={{
                        ...typography.headline,
                        color: theme.text,
                        marginBottom: spacing[2],
                      }}
                    >
                      {sectionTitle(key)}
                    </Text>
                    <View style={{ gap: spacing[2] }}>
                      {items.map((n) => (
                        <NotificationRow
                          key={n.id}
                          notification={n}
                          locale={i18n.language}
                          onPress={() => onOpen(n)}
                        />
                      ))}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {unreadCount > 0 ? (
            <View
              style={{
                position: "absolute",
                left: spacing[4],
                right: spacing[4],
                bottom: spacing[4] + insets.bottom,
              }}
            >
              <Pressable
                onPress={() => markAll.mutate()}
                accessibilityRole="button"
                style={{
                  minHeight: 48,
                  borderRadius: radius.full,
                  borderWidth: 1.5,
                  borderColor: theme.primary,
                  backgroundColor: theme.surface,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing[2],
                  paddingHorizontal: spacing[4],
                }}
              >
                <Text
                  style={{
                    color: theme.primary,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  ✓
                </Text>
                <Text
                  style={{
                    ...typography.label,
                    color: theme.primary,
                  }}
                >
                  {t("notifications.markAllRead")}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function FilterTabButton({
  label,
  badge,
  active,
  onPress,
  color,
  muted,
}: {
  label: string;
  badge?: number;
  active: boolean;
  onPress: () => void;
  color: string;
  muted: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={{
        flex: 1,
        alignItems: "center",
        paddingVertical: spacing[3],
        borderBottomWidth: 2,
        borderBottomColor: active ? color : "transparent",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text
          style={{
            ...typography.label,
            color: active ? color : muted,
            fontWeight: active ? "700" : "500",
          }}
        >
          {label}
        </Text>
        {badge != null ? (
          <Text
            style={{
              ...typography.label,
              color,
              fontWeight: "700",
            }}
          >
            {badge}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function NotificationRow({
  notification,
  locale,
  onPress,
}: {
  notification: AppNotification;
  locale: string;
  onPress: () => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const visual = visualForNotification(notification);
  const unread = notification.status === "UNREAD";

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        gap: spacing[3],
        padding: spacing[3],
        backgroundColor: theme.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        alignItems: "flex-start",
      }}
    >
      <View
        style={{
          width: ICON_TILE,
          height: ICON_TILE,
          borderRadius: radius.sm,
          backgroundColor: visual.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <NotificationTypeIcon
          kind={visual.kind}
          color={visual.iconColor}
          size={22}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            ...typography.label,
            color: theme.text,
          }}
          numberOfLines={2}
        >
          {notification.title}
        </Text>
        {notification.body ? (
          <Text
            style={{
              ...typography.caption,
              color: theme.textBody,
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
        ) : null}
        <Text
          style={{
            ...typography.caption,
            color: theme.textMuted,
            marginTop: spacing[1],
          }}
        >
          {formatNotificationTime(notification.createdAt, locale)}
        </Text>
      </View>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          marginTop: 6,
          backgroundColor: unread ? theme.primary : theme.border,
        }}
      />
    </Pressable>
  );
}
