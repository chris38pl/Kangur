import { getWorkspaceIconEmoji } from "@shared/workspace-icons";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { FeedbackSheet } from "@/components/feedback-sheet";
import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { useMe } from "@/features/auth/useMe";
import { EditWorkspaceSheet } from "@/features/workspace/edit-workspace-sheet";
import type { Workspace } from "@/features/workspace/schemas";
import { useUpdateWorkspace } from "@/features/workspace/useUpdateWorkspace";
import { ACTIVE_WORKSPACE_ID_QUERY_KEY } from "@/features/workspace/useActiveWorkspace";
import { ApiClientError } from "@/lib/api/client";
import { formatRelativeUpdatedAt } from "@/lib/formatRelativeUpdatedAt";

import {
  ADMIN_BROWSING_WORKSPACE_ID_QUERY_KEY,
  ADMIN_BROWSING_WORKSPACE_QUERY_KEY,
  writeAdminBrowsingWorkspaceId,
} from "./admin-browsing";
import {
  deletePlatformWorkspace,
  getPlatformWorkspaceDetail,
  listPlatformWorkspaces,
} from "./api";
import type { PlatformWorkspaceListItem } from "./schemas";
import { WorkspaceBrowserActionsSheet } from "./workspace-browser-actions-sheet";

type PlanFilter = "all" | "free" | "premium";

function PlanChips({
  value,
  onChange,
}: {
  value: PlanFilter;
  onChange: (v: PlanFilter) => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const options: { id: PlanFilter; label: string }[] = [
    { id: "all", label: t("workspaceBrowser.filterAll") },
    { id: "free", label: t("workspaceBrowser.filterFree") },
    { id: "premium", label: t("workspaceBrowser.filterPremium") },
  ];

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[2] }}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={{
              paddingVertical: spacing[2],
              paddingHorizontal: spacing[3],
              borderRadius: radius.full,
              backgroundColor: selected ? "transparent" : theme.section,
              borderWidth: 1.5,
              borderColor: selected ? theme.primary : "transparent",
            }}
          >
            <Text
              style={{
                ...typography.caption,
                fontWeight: selected ? "600" : "500",
                color: selected ? theme.primary : theme.text,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function WorkspaceRow({
  item,
  onOpenMenu,
  onPress,
}: {
  item: PlatformWorkspaceListItem;
  onOpenMenu: () => void;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const emoji = getWorkspaceIconEmoji(item.icon) ?? "🏠";

  const relativeLabels = {
    justNow: t("home.updatedJustNow"),
    minutes: (n: number) => t("home.updatedMinutes", { count: n }),
    hours: (n: number) => t("home.updatedHours", { count: n }),
    days: (n: number) => t("home.updatedDays", { count: n }),
  };

  const lastUsed = formatRelativeUpdatedAt(item.lastUsedAt, relativeLabels);
  const planLabel =
    item.plan === "premium"
      ? t("workspaceBrowser.planPremium")
      : t("workspaceBrowser.planFree");

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        paddingVertical: spacing[3],
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[3],
          minWidth: 0,
        }}
      >
        <Text style={{ fontSize: 28 }}>{emoji}</Text>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{ ...typography.label, color: theme.text }}
          >
            {item.name}
          </Text>
          <Text
            numberOfLines={1}
            style={{ ...typography.caption, color: theme.textMuted }}
          >
            {planLabel}
            {" · "}
            {t("workspaceBrowser.members", { count: item.memberCount })}
            {" · "}
            {lastUsed}
          </Text>
          {item.ownerEmail ? (
            <Text
              numberOfLines={1}
              style={{ ...typography.caption, color: theme.textMuted }}
            >
              {item.ownerEmail}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        onPress={onOpenMenu}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={t("workspaceBrowser.actionsA11y")}
        style={{
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.full,
        }}
      >
        <Text style={{ fontSize: 20, color: theme.textMuted, lineHeight: 22 }}>
          ⋯
        </Text>
      </Pressable>
    </View>
  );
}

export function WorkspaceBrowserScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const meQuery = useMe();
  const isAdmin = meQuery.data?.platformRole === "ADMIN";
  const updateWorkspaceMutation = useUpdateWorkspace();

  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [plan, setPlan] = useState<PlanFilter>("all");
  const [menuItem, setMenuItem] = useState<PlatformWorkspaceListItem | null>(
    null,
  );
  const [editWorkspace, setEditWorkspace] = useState<Workspace | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<PlatformWorkspaceListItem | null>(null);
  const [busy, setBusy] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const onChangeQuery = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(text.trim());
    }, 300);
  }, []);
  const listQuery = useQuery({
    queryKey: ["platform", "workspaces", debouncedQ, plan],
    enabled: isAdmin,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing Clerk token");
      return listPlatformWorkspaces(token, {
        q: debouncedQ || undefined,
        plan,
      });
    },
  });

  const workspaces = listQuery.data?.workspaces ?? [];

  const enterWorkspace = useCallback(
    async (item: PlatformWorkspaceListItem) => {
      setBusy(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Missing Clerk token");
        const detail = await getPlatformWorkspaceDetail(token, item.id);
        await writeAdminBrowsingWorkspaceId(item.id);
        queryClient.setQueryData(ADMIN_BROWSING_WORKSPACE_ID_QUERY_KEY, item.id);
        queryClient.setQueryData(
          [...ADMIN_BROWSING_WORKSPACE_QUERY_KEY, item.id],
          detail,
        );
        queryClient.setQueryData(ACTIVE_WORKSPACE_ID_QUERY_KEY, item.id);
        await AsyncStorage.setItem("kangur.activeWorkspaceId", item.id);
        setMenuItem(null);
        router.replace("/(tabs)" as never);
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : t("workspaceBrowser.enterFailed");
        Alert.alert(t("workspaceBrowser.title"), message);
      } finally {
        setBusy(false);
      }
    },
    [getToken, queryClient, router, t],
  );

  const openEdit = useCallback(
    async (item: PlatformWorkspaceListItem) => {
      setBusy(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Missing Clerk token");
        const detail = await getPlatformWorkspaceDetail(token, item.id);
        setMenuItem(null);
        setEditWorkspace(detail);
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : t("workspaceBrowser.editFailed");
        Alert.alert(t("workspaceBrowser.title"), message);
      } finally {
        setBusy(false);
      }
    },
    [getToken, t],
  );

  const confirmDelete = useCallback((item: PlatformWorkspaceListItem) => {
    setDeleteTarget(item);
  }, []);

  const performDelete = useCallback(async () => {
    const item = deleteTarget;
    if (!item) return;
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Missing Clerk token");
      await deletePlatformWorkspace(token, item.id);
      setDeleteTarget(null);
      setMenuItem(null);
      await queryClient.invalidateQueries({
        queryKey: ["platform", "workspaces"],
      });
      const browsing = queryClient.getQueryData<string | null>(
        ADMIN_BROWSING_WORKSPACE_ID_QUERY_KEY,
      );
      if (browsing === item.id) {
        await writeAdminBrowsingWorkspaceId(null);
        queryClient.setQueryData(ADMIN_BROWSING_WORKSPACE_ID_QUERY_KEY, null);
        queryClient.removeQueries({
          queryKey: ADMIN_BROWSING_WORKSPACE_QUERY_KEY,
        });
      }
      const active = queryClient.getQueryData<string | null>(
        ACTIVE_WORKSPACE_ID_QUERY_KEY,
      );
      if (active === item.id) {
        queryClient.setQueryData(ACTIVE_WORKSPACE_ID_QUERY_KEY, null);
        await AsyncStorage.removeItem("kangur.activeWorkspaceId");
      }
      await queryClient.invalidateQueries({
        queryKey: ["workspaces"],
      });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : t("workspaceBrowser.deleteFailed");
      Alert.alert(t("workspaceBrowser.title"), message);
    } finally {
      setBusy(false);
    }
  }, [deleteTarget, getToken, queryClient, t]);

  const header = useMemo(
    () => (
      <View style={{ gap: spacing[3], marginBottom: spacing[4] }}>
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder={t("workspaceBrowser.searchPlaceholder")}
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            ...typography.body,
            color: theme.text,
            backgroundColor: theme.section,
            borderRadius: radius.lg,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            borderWidth: 1,
            borderColor: theme.border,
          }}
        />
        <PlanChips value={plan} onChange={setPlan} />
        {listQuery.data ? (
          <Text style={{ ...typography.caption, color: theme.textMuted }}>
            {t("workspaceBrowser.total", { count: listQuery.data.total })}
          </Text>
        ) : null}
      </View>
    ),
    [
      query,
      onChangeQuery,
      t,
      theme,
      plan,
      listQuery.data,
    ],
  );

  if (meQuery.isPending) {
    return (
      <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing[2],
            minHeight: 52,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("auth.back")}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BackIcon size={20} />
          </Pressable>
        </View>
        <View style={{ padding: spacing[6] }}>
          <Text style={{ ...typography.body, color: theme.textMuted }}>
            {t("workspaceBrowser.forbidden")}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing[2],
          paddingBottom: spacing[2],
          minHeight: 52,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("auth.back")}
          style={{
            width: 44,
            height: 44,
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
            flex: 1,
            textAlign: "center",
            marginRight: 44,
          }}
        >
          {t("workspaceBrowser.title")}
        </Text>
      </View>

      <FlatList
        data={workspaces}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingBottom: spacing[10],
          gap: spacing[3],
        }}
        ListHeaderComponent={header}
        ListEmptyComponent={
          listQuery.isPending ? (
            <ActivityIndicator color={theme.primary} style={{ marginTop: 24 }} />
          ) : (
            <Text
              style={{
                ...typography.body,
                color: theme.textMuted,
                textAlign: "center",
                marginTop: spacing[8],
              }}
            >
              {t("workspaceBrowser.empty")}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <WorkspaceRow
            item={item}
            onPress={() => void enterWorkspace(item)}
            onOpenMenu={() => setMenuItem(item)}
          />
        )}
        refreshing={listQuery.isRefetching}
        onRefresh={() => void listQuery.refetch()}
      />

      <WorkspaceBrowserActionsSheet
        visible={menuItem != null}
        workspaceName={menuItem?.name ?? ""}
        busy={busy}
        onClose={() => setMenuItem(null)}
        onEnter={() => {
          if (menuItem) void enterWorkspace(menuItem);
        }}
        onEdit={() => {
          if (menuItem) void openEdit(menuItem);
        }}
        onDelete={() => {
          if (menuItem) confirmDelete(menuItem);
        }}
      />

      <EditWorkspaceSheet
        key={editWorkspace ? editWorkspace.id : "closed"}
        visible={editWorkspace != null}
        workspace={editWorkspace}
        busy={updateWorkspaceMutation.isPending}
        onClose={() => setEditWorkspace(null)}
        onSave={(input) => {
          if (!editWorkspace) return;
          updateWorkspaceMutation.mutate(
            {
              workspaceId: editWorkspace.id,
              name: input.name,
              icon: input.icon,
            },
            {
              onSuccess: async () => {
                setEditWorkspace(null);
                await queryClient.invalidateQueries({
                  queryKey: ["platform", "workspaces"],
                });
                await queryClient.invalidateQueries({
                  queryKey: ["workspaces"],
                });
                // Refresh admin overlay DTO if currently browsing this space.
                const browsing = queryClient.getQueryData<string | null>(
                  ADMIN_BROWSING_WORKSPACE_ID_QUERY_KEY,
                );
                if (browsing === editWorkspace.id) {
                  queryClient.setQueryData(
                    [...ADMIN_BROWSING_WORKSPACE_QUERY_KEY, editWorkspace.id],
                    {
                      ...editWorkspace,
                      name: input.name,
                      icon: input.icon,
                    },
                  );
                }
              },
              onError: (error) => {
                const message =
                  error instanceof ApiClientError
                    ? error.message
                    : t("workspaceBrowser.editFailed");
                Alert.alert(t("workspaceBrowser.title"), message);
              },
            },
          );
        }}
      />

      <FeedbackSheet
        visible={deleteTarget != null}
        image={brandAssets.deleteList}
        title={t("workspaceBrowser.deleteTitle")}
        body={
          deleteTarget
            ? t("workspaceBrowser.deleteBody", { name: deleteTarget.name })
            : undefined
        }
        primaryLabel={t("workspaceBrowser.deleteConfirm")}
        onPrimary={() => void performDelete()}
        secondaryLabel={t("workspaceBrowser.cancel")}
        onSecondary={() => {
          if (!busy) setDeleteTarget(null);
        }}
        primaryDestructive
        busy={busy && deleteTarget != null}
        imageWidth={200}
        imageHeight={200}
      />
    </Screen>
  );
}
