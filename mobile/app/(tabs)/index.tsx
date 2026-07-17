import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
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
import { isListProvisional } from "@/features/shopping-list/provisional-list";
import { useResumableSessions } from "@/features/shopping-list/session/useResumableSessions";
import {
  useArchiveShoppingList,
  useShoppingLists,
} from "@/features/shopping-list/useShoppingLists";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaceMembers } from "@/features/workspace/useWorkspaceMembers";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { HomeWorkspaceBanner } from "@/features/workspace/home-workspace-banner";
import { formatRelativeUpdatedAt } from "@/lib/formatRelativeUpdatedAt";
import { useTabBarClearance } from "@/hooks/useSafeAreaLayout";

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
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", gap: spacing[2] }}
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
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const workspacesQuery = useWorkspaces();
  const { activeWorkspace, hydrated } = useActiveWorkspace(workspacesQuery.data);
  const membersQuery = useWorkspaceMembers(activeWorkspace?.id ?? null, hydrated);
  const listsQuery = useShoppingLists(activeWorkspace?.id ?? null, hydrated);
  const sessionsQuery = useResumableSessions(hydrated);
  const archiveList = useArchiveShoppingList(activeWorkspace?.id ?? null);
  const archiveEmpty = useRef(archiveList.mutateAsync);
  archiveEmpty.current = archiveList.mutateAsync;
  const { createAndOpen } = useCreateList();
  const tabClearance = useTabBarClearance();

  const lists = useMemo(
    () => (listsQuery.data ?? []).filter((list) => (list.itemCount ?? 0) > 0),
    [listsQuery.data],
  );
  const recentLists = useMemo(() => lists.slice(0, 6), [lists]);

  const resumable = useMemo(() => {
    const sessions = sessionsQuery.data ?? [];
    return sessions.flatMap((session) => {
      const list = (listsQuery.data ?? []).find((l) => l.id === session.listId);
      if (!list || list.status !== "active") return [];
      // Hide empty abandoned lists from continue section too
      if ((list.itemCount ?? 0) === 0) return [];
      return [{ session, list }];
    });
  }, [sessionsQuery.data, listsQuery.data]);

  // Persist only lists with products — archive leftover empties (skip ones still being edited).
  useEffect(() => {
    const all = listsQuery.data;
    if (!all) return;
    for (const list of all) {
      if (list.status !== "active") continue;
      if ((list.itemCount ?? 0) > 0) continue;
      if (isListProvisional(list.id)) continue;
      void archiveEmpty.current(list.id).catch(() => {
        // best-effort
      });
    }
  }, [listsQuery.data]);

  // Tabs keep Home mounted — refresh Continue + lists whenever this screen is focused.
  useFocusEffect(
    useCallback(() => {
      void sessionsQuery.refetch();
      void listsQuery.refetch();
    }, [listsQuery, sessionsQuery]),
  );
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
    { path: "empty", icon: "✨", label: t("home.createEmpty") },
  ];

  if (workspacesQuery.isPending || !hydrated || listsQuery.isPending) {
    return (
      <Screen edges={["top"]} style={{ backgroundColor: theme.section }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={theme.primary} />
        </View>
      </Screen>
    );
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
            onPress={() => router.push("/(tabs)/workspace" as never)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("tabs.workspace")}
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
            onPress={() => router.push("/(tabs)/profile" as never)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("tabs.profile")}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconBell color={brand.primaryHover} size={24} />
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
                  ? () => router.push("/(tabs)/workspace" as never)
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
          <View style={{ flexDirection: "row", gap: spacing[2] }}>
            {quickActions.map((action) => (
              <QuickAction
                key={action.path}
                icon={action.icon}
                label={action.label}
                onPress={() => void createAndOpen(action.path)}
              />
            ))}
          </View>
        </View>

        {activeWorkspace ? (
          <View style={{ marginBottom: spacing[6] }}>
            <SectionHeader title={t("home.activeWorkspace")} />
            <HomeWorkspaceBanner
              workspace={activeWorkspace}
              members={membersQuery.data ?? []}
              onPress={() => router.push("/(tabs)/workspace" as never)}
            />
          </View>
        ) : null}

        <View>
          <SectionHeader
            title={t("home.recentLists")}
            actionLabel={lists.length > 0 ? t("home.seeAll") : undefined}
            onAction={
              lists.length > 0
                ? () => router.push("/(tabs)/workspace" as never)
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
