import { router, useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { HomeSkeleton } from "@/components/skeleton";
import { useColorScheme } from "@/components/useColorScheme";
import { IconBell, IconMenu } from "@/components/tab-bar/tab-icons";
import { brandAssets } from "@/design-system/brand-assets";
import {
  brand,
  colors,
  radius,
  spacing,
  typography,
} from "@/design-system/tokens";
import { useCreateList } from "@/features/shopping-list/create-list-provider";
import type { CreateListPath } from "@/features/shopping-list/create-list-sheet";
import type { ShoppingList } from "@/features/shopping-list/schemas";
import { useNotifications, useNotificationPreferences } from "@/features/notifications/useNotifications";
import { refreshNotifications } from "@/features/notifications/refreshNotifications";
import { perfEnd, perfStart } from "@/lib/performance";
import { useResumableSessions } from "@/features/shopping-list/session/useResumableSessions";
import { useShoppingLists } from "@/features/shopping-list/useShoppingLists";
import { useAiCredits } from "@/features/billing/useAiCredits";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaceMembers } from "@/features/workspace/useWorkspaceMembers";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { HomeWorkspaceBanner } from "@/features/workspace/home-workspace-banner";
import { formatRelativeUpdatedAt } from "@/lib/formatRelativeUpdatedAt";
import { intlLocaleTag } from "@/lib/i18n/locales";
import {
  isHistorySuggestionsEnabled,
  isMealProposalEnabled,
} from "@/lib/featureGates";
import { useTabBarClearance } from "@/hooks/useSafeAreaLayout";

const QUICK_ACTION_GAP = spacing[2];
const QUICK_ACTIONS_VISIBLE = 4;

function formatCreditsRefreshDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(intlLocaleTag(locale), {
      day: "numeric",
      month: "long",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing[3],
      }}
    >
      <Text style={{ ...typography.headline, color: theme.text }}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ ...typography.label, color: brand.primaryHover }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  width,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  width: number;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      style={{ width, alignItems: "center", gap: spacing[2] }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.full,
          backgroundColor: brand.accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 26 }}>{icon}</Text>
      </View>
      <Text
        style={{
          ...typography.caption,
          color: theme.text,
          fontWeight: "600",
          textAlign: "center",
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ListBagIcon({ size = 48 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.lg,
        backgroundColor: brand.accent,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Image
        source={brandAssets.listBag}
        style={{
          width: size * 0.82,
          height: size * 0.82,
          resizeMode: "contain",
        }}
        accessibilityLabel=""
      />
    </View>
  );
}

function ResumeCard({
  list,
  updatedLabel,
  onResume,
}: {
  list: ShoppingList;
  updatedLabel: string;
  onResume: () => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Pressable
      onPress={onResume}
      accessibilityRole="button"
      accessibilityLabel={t("home.resume")}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        backgroundColor: theme.surface,
        borderRadius: radius.xl,
        padding: spacing[4],
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <ListBagIcon size={52} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ ...typography.headline, color: theme.text }}
          numberOfLines={1}
        >
          {list.name}
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: theme.textBody,
            marginTop: 2,
            fontWeight: "500",
          }}
          numberOfLines={1}
        >
          {t("home.productCount", { count: list.itemCount ?? 0 })}
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: theme.textMuted,
            marginTop: 1,
          }}
          numberOfLines={1}
        >
          {updatedLabel}
        </Text>
      </View>
      <Text style={{ fontSize: 22, color: theme.textMuted, fontWeight: "300" }}>
        ›
      </Text>
    </Pressable>
  );
}

function RecentListRow({
  list,
  updatedLabel,
  onPress,
}: {
  list: ShoppingList;
  updatedLabel: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        backgroundColor: theme.surface,
        borderRadius: radius.xl,
        padding: spacing[4],
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <ListBagIcon size={48} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ ...typography.headline, color: theme.text }}
          numberOfLines={1}
        >
          {list.name}
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: theme.textBody,
            marginTop: 2,
            fontWeight: "500",
          }}
          numberOfLines={1}
        >
          {t("home.productCount", { count: list.itemCount ?? 0 })}
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: theme.textMuted,
            marginTop: 1,
          }}
          numberOfLines={1}
        >
          {updatedLabel}
        </Text>
      </View>
      <Text style={{ fontSize: 22, color: theme.textMuted, fontWeight: "300" }}>
        ›
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const queryClient = useQueryClient();
  const workspacesQuery = useWorkspaces();
  const notificationsQuery = useNotifications();
  const prefsQuery = useNotificationPreferences();
  const { activeWorkspace, hydrated } = useActiveWorkspace(workspacesQuery.data);
  const membersQuery = useWorkspaceMembers(activeWorkspace?.id ?? null, hydrated);
  const listsQuery = useShoppingLists(activeWorkspace?.id ?? null, hydrated);
  const sessionsQuery = useResumableSessions(hydrated);
  const creditsQuery = useAiCredits(activeWorkspace?.id ?? null);
  const { createAndOpen } = useCreateList();
  const tabClearance = useTabBarClearance();
  const [refreshing, setRefreshing] = useState(false);
  const [quickActionsWidth, setQuickActionsWidth] = useState(0);

  const workspaceId = activeWorkspace?.id ?? null;
  const credits = creditsQuery.data;
  const creditsLimit = credits?.limit ?? 0;
  const creditsRemaining = credits?.remaining ?? 0;
  const creditsProgress =
    !credits || credits.unlimited || creditsLimit <= 0
      ? 1
      : Math.min(1, Math.max(0, creditsRemaining / creditsLimit));

  const lists = useMemo(
    () => (listsQuery.data ?? []).filter((list) => (list.itemCount ?? 0) > 0),
    [listsQuery.data],
  );
  const recentLists = useMemo(() => lists.slice(0, 6), [lists]);

  const resumable = useMemo(() => {
    const sessions = sessionsQuery.data ?? [];
    const rows = sessions.flatMap((session) => {
      const list = (listsQuery.data ?? []).find((l) => l.id === session.listId);
      if (!list || list.status !== "active") return [];
      // Hide empty abandoned lists from continue section too
      if ((list.itemCount ?? 0) === 0) return [];
      return [{ session, list }];
    });
    // Newest shopping activity first (session touch > list updatedAt).
    return rows.sort((a, b) => {
      const aAt = Date.parse(a.session.updatedAt) || 0;
      const bAt = Date.parse(b.session.updatedAt) || 0;
      if (bAt !== aAt) return bAt - aAt;
      const aList = Date.parse(a.list.updatedAt) || 0;
      const bList = Date.parse(b.list.updatedAt) || 0;
      return bList - aList;
    });
  }, [sessionsQuery.data, listsQuery.data]);

  // Empty untitled lists are hidden from Home UI already - do not auto-archive
  // them here (races with AI create / provisional editing and deletes the list mid-ingest).
  // Cleanup of abandoned empties happens on leave via list screen beforeRemove.

  const refreshHome = useCallback(async () => {
    // Stable deps only — never put query result objects in this callback
    // (they change every refetch and would re-fire useFocusEffect in a loop).
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ["workspaces"] }),
      workspaceId
        ? queryClient.refetchQueries({
            queryKey: ["shopping-lists", workspaceId],
          })
        : Promise.resolve(),
      queryClient.refetchQueries({
        queryKey: ["shopping-sessions", "resumable"],
      }),
      workspaceId
        ? queryClient.refetchQueries({
            queryKey: ["workspace-members", workspaceId],
          })
        : Promise.resolve(),
    ]);
  }, [queryClient, workspaceId]);

  // Heavy queries: no forced focus refetch (staleTime + pull-to-refresh + mutation invalidation).
  // Light paths may still refresh on focus elsewhere; do not set refetchOnWindowFocus globally.

  useFocusEffect(
    useCallback(() => {
      perfStart("home.data", { id: "home-focus" });
      // End when lists are already available from cache or after a short tick.
      requestAnimationFrame(() => {
        perfEnd("home.data", { id: "home-focus" });
      });
    }, []),
  );

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshHome(),
        refreshNotifications(queryClient),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, refreshHome]);

  const relativeLabels = useMemo(
    () => ({
      justNow: t("home.updatedJustNow"),
      minutes: (n: number) => t("home.updatedMinutes", { count: n }),
      hours: (n: number) => t("home.updatedHours", { count: n }),
      days: (n: number) => t("home.updatedDays", { count: n }),
    }),
    [t],
  );

  const updatedLabel = (iso: string) =>
    t("home.updatedPrefix", {
      time: formatRelativeUpdatedAt(iso, relativeLabels),
    });

  const welcomeTitle = t("home.welcomeTitle");
  const welcomeTitleSplit = welcomeTitle.lastIndexOf(" ");
  const welcomeTitleLead =
    welcomeTitleSplit >= 0
      ? welcomeTitle.slice(0, welcomeTitleSplit + 1)
      : welcomeTitle;
  const welcomeTitleBrand =
    welcomeTitleSplit >= 0 ? welcomeTitle.slice(welcomeTitleSplit + 1) : "";

  const quickActions: {
    path: CreateListPath;
    icon: string;
    label: string;
  }[] = [
    { path: "screenshot", icon: "📷", label: t("home.createScreenshot") },
    { path: "clipboard", icon: "🛒", label: t("home.quickClipboard") },
    { path: "describe", icon: "📝", label: t("home.quickText") },
    ...(isMealProposalEnabled()
      ? [
          {
            path: "fromRecipe" as const,
            icon: "🍽️",
            label: t("home.quickFromRecipe"),
          },
        ]
      : []),
    ...(isHistorySuggestionsEnabled()
      ? [
          {
            path: "fromHistory" as const,
            icon: "🕒",
            label: t("home.quickHistory"),
          },
        ]
      : []),
    { path: "empty", icon: "✨", label: t("home.createEmpty") },
  ];

  const quickActionWidth =
    quickActionsWidth > 0
      ? (quickActionsWidth - QUICK_ACTION_GAP * (QUICK_ACTIONS_VISIBLE - 1)) /
        QUICK_ACTIONS_VISIBLE
      : 72;

  if (
    workspacesQuery.isPending ||
    !hydrated ||
    (Boolean(activeWorkspace?.id) && listsQuery.isPending)
  ) {
    return <HomeSkeleton showTabBar={false} />;
  }

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.section }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing[6],
          paddingTop: spacing[2],
          paddingBottom: tabClearance,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onPullRefresh()}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: spacing[4],
          }}
        >
          <Pressable
            onPress={() => router.push("./menu" as never)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("appMenu.open")}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconMenu color={theme.text} size={24} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/notification-center" as never)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("notifications.centerTitle")}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconBell color={brand.primaryHover} size={24} />
            {!prefsQuery.data?.silentMode &&
            (notificationsQuery.data?.unreadCount ?? 0) > 0 ? (
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor: brand.primary,
                  borderWidth: 1.5,
                  borderColor: theme.bg,
                }}
              />
            ) : null}
          </Pressable>
        </View>

        <View style={{ alignItems: "center", marginBottom: spacing[3] }}>
          <Text
            style={{
              ...typography.title,
              color: theme.text,
              textAlign: "center",
            }}
          >
            {welcomeTitleLead}
            {welcomeTitleBrand ? (
              <Text style={{ color: theme.primary }}>{welcomeTitleBrand}</Text>
            ) : null}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              textAlign: "center",
              marginTop: spacing[2],
              paddingHorizontal: spacing[4],
            }}
          >
            {t("home.welcomeSubtitle")}
          </Text>
          <Image
            source={brandAssets.homeHero}
            style={{
              width: 260,
              height: 260,
              marginTop: spacing[4],
              resizeMode: "contain",
            }}
            accessibilityLabel="Kangur"
          />
        </View>

        {resumable.length > 0 ? (
          <View style={{ marginBottom: spacing[3] }}>
            <SectionHeader
              title={t("home.continueShopping")}
              actionLabel={
                resumable.length > 2 ? t("home.seeAll") : undefined
              }
              onAction={
                resumable.length > 2
                  ? () =>
                      router.push({
                        pathname: "/(tabs)/history",
                        params: { segment: "shopping" },
                      } as never)
                  : undefined
              }
            />
            {resumable.slice(0, 2).map(({ list }) => (
              <ResumeCard
                key={list.id}
                list={list}
                updatedLabel={updatedLabel(list.updatedAt)}
                onResume={() =>
                  router.push(`/list/${list.id}/shop` as never)
                }
              />
            ))}
          </View>
        ) : null}

        <View style={{ marginBottom: spacing[6] }}>
          <SectionHeader title={t("home.quickActions")} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            onLayout={(e) => setQuickActionsWidth(e.nativeEvent.layout.width)}
            contentContainerStyle={{ gap: QUICK_ACTION_GAP }}
          >
            {quickActions.map((action) => (
              <QuickAction
                key={action.path}
                icon={action.icon}
                label={action.label}
                width={quickActionWidth}
                onPress={() => void createAndOpen(action.path)}
              />
            ))}
          </ScrollView>
        </View>

        {activeWorkspace ? (
          <View style={{ marginBottom: spacing[6] }}>
            <SectionHeader title={t("home.activeWorkspace")} />
            <HomeWorkspaceBanner
              workspace={activeWorkspace}
              members={membersQuery.data ?? []}
              onPress={() => router.push("/(tabs)/workspace" as never)}
            />
            {credits && !credits.unlimited ? (
              <Pressable
                onPress={() => router.push("/premium")}
                accessibilityRole="button"
                accessibilityLabel={t("billing.upgradeCta")}
                style={{
                  marginTop: spacing[3],
                  alignSelf: "stretch",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: spacing[2],
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "baseline",
                      gap: spacing[2],
                      flexShrink: 1,
                    }}
                  >
                    <Text
                      style={{ ...typography.caption, color: theme.textMuted }}
                    >
                      {t("billing.aiCredits")}
                    </Text>
                    <Text>
                      <Text
                        style={{
                          ...typography.headline,
                          color: theme.primary,
                          fontSize: 16,
                          lineHeight: 20,
                        }}
                      >
                        {creditsRemaining}
                      </Text>
                      <Text
                        style={{
                          ...typography.headline,
                          color: theme.primaryLight,
                          fontSize: 14,
                          lineHeight: 20,
                        }}
                      >
                        {" / "}
                        {creditsLimit}
                      </Text>
                    </Text>
                  </View>
                  <Text
                    style={{
                      ...typography.caption,
                      color: theme.textMuted,
                      fontSize: 11,
                      lineHeight: 14,
                      flexShrink: 1,
                      textAlign: "right",
                    }}
                  >
                    {t("billing.creditsRefreshed", {
                      date: formatCreditsRefreshDate(
                        credits.periodStart,
                        i18n.language,
                      ),
                    })}
                  </Text>
                </View>
                <View
                  style={{
                    marginTop: spacing[2],
                    width: "100%",
                    height: 6,
                    borderRadius: radius.full,
                    backgroundColor: `${theme.primary}22`,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${Math.round(creditsProgress * 100)}%`,
                      height: "100%",
                      backgroundColor: theme.primary,
                      borderRadius: radius.full,
                    }}
                  />
                </View>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View>
          <SectionHeader
            title={t("home.recentLists")}
            actionLabel={lists.length > 0 ? t("home.seeAll") : undefined}
            onAction={
              lists.length > 0
                ? () =>
                    router.push({
                      pathname: "/(tabs)/history",
                      params: { segment: "waiting" },
                    } as never)
                : undefined
            }
          />
          {recentLists.length === 0 ? (
            <View
              style={{
                paddingVertical: spacing[8],
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  ...typography.body,
                  color: theme.textMuted,
                  textAlign: "center",
                }}
              >
                {t("home.recentEmpty")}
              </Text>
            </View>
          ) : (
            recentLists.map((list) => (
              <RecentListRow
                key={list.id}
                list={list}
                updatedLabel={updatedLabel(list.updatedAt)}
                onPress={() => router.push(`/list/${list.id}` as never)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
