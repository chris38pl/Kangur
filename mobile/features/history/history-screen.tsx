import { useAuth } from "@clerk/clerk-expo";
import { MAX_PREFERRED_FOR_AI_LISTS } from "@shared/ai-history";
import { getShoppingCategoryIcon } from "@shared/shopping-categories";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useAppResult } from "@/components/AppResultProvider";
import { FeedbackSheet } from "@/components/feedback-sheet";
import { KangurMascot } from "@/components/KangurMascot";
import { FallbackSymbol } from "@/components/FallbackSymbol";
import {
  ShowMoreButton,
  useListPagination,
} from "@/components/pagination";
import { Screen } from "@/components/Screen";
import { ListsSkeleton } from "@/components/skeleton";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { LoadingTransition, FadeInContent } from "@/lib/motion";
import {
  brand,
  colors,
  radius,
  spacing,
  typography,
} from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { CATEGORY_BADGE_COLORS } from "@/features/shopping-item/category-badge-colors";
import { DeleteListDialog } from "@/features/shopping-list/delete-list-dialog";
import { updateShoppingList } from "@/features/shopping-list/api";
import type { ShoppingList } from "@/features/shopping-list/schemas";
import { useResumableSessions } from "@/features/shopping-list/session/useResumableSessions";
import {
  useArchiveShoppingList,
  useShoppingLists,
} from "@/features/shopping-list/useShoppingLists";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { useTabBarClearance } from "@/hooks/useSafeAreaLayout";
import { ApiClientError } from "@/lib/api/client";
import { formatRelativeUpdatedAt } from "@/lib/formatRelativeUpdatedAt";
import { goRoot } from "@/lib/navigation";
import { PremiumHintRow } from "@/features/billing/premium-hint-row";

import { HistoryActionsSheet } from "./history-actions-sheet";
import { HistoryPreviewSheet } from "./history-preview-sheet";
import {
  PreferredForAiSheet,
  type PreferredForAiSheetVariant,
} from "./preferred-for-ai-sheet";
import type { HistoryPreviewItem } from "./schemas";
import {
  historyOpened,
  historyRepeat,
  historyRepeatCompleted,
  historyRestore,
  historySearch,
} from "./historyTelemetry";
import {
  useHistoryLists,
  useRepeatHistoryList,
  useRestoreHistoryList,
} from "./useHistoryLists";

type ListsSegment = "all" | "shopping" | "waiting" | "finished";

type ListCardModel = {
  id: string;
  name: string;
  itemCount: number;
  updatedAt: string;
  previewItems: HistoryPreviewItem[];
  itemNames: string[];
  preferredForAi: boolean;
  kind: "active" | "archived";
  /** UI segment this card belongs to (for actions + open target). */
  group: "shopping" | "waiting" | "finished";
};

const SEGMENTS: { id: ListsSegment; labelKey: string }[] = [
  { id: "all", labelKey: "history.segmentAll" },
  { id: "shopping", labelKey: "history.segmentShopping" },
  { id: "waiting", labelKey: "history.segmentWaiting" },
  { id: "finished", labelKey: "history.segmentFinished" },
];

function parseListsSegment(value: unknown): ListsSegment | null {
  if (
    value === "all" ||
    value === "shopping" ||
    value === "waiting" ||
    value === "finished"
  ) {
    return value;
  }
  return null;
}

function filterListsByQuery(lists: ListCardModel[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return lists;
  return lists.filter((list) => {
    if (list.name.toLowerCase().includes(q)) return true;
    return list.itemNames.some((name) => name.toLowerCase().includes(q));
  });
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

function ProductBadges({
  items,
  moreCount,
}: {
  items: HistoryPreviewItem[];
  moreCount: number;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const { t } = useTranslation();

  if (items.length === 0 && moreCount <= 0) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing[1] + 2,
        marginTop: spacing[2],
      }}
    >
      {items.map((item, index) => {
        const badge = CATEGORY_BADGE_COLORS[item.category];
        return (
          <View
            key={`${item.name}-${index}`}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: badge.background,
              borderRadius: radius.full,
              paddingLeft: spacing[2] + 2,
              paddingRight: spacing[2],
              paddingVertical: 3,
              maxWidth: "100%",
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                flexShrink: 1,
                fontSize: 11,
                lineHeight: 14,
                fontWeight: "600",
                color: badge.text,
              }}
            >
              {item.name}
            </Text>
            <Text style={{ fontSize: 11, lineHeight: 14 }}>
              {getShoppingCategoryIcon(item.category)}
            </Text>
          </View>
        );
      })}
      {moreCount > 0 ? (
        <View
          style={{
            backgroundColor: theme.section,
            borderRadius: radius.full,
            paddingHorizontal: spacing[2] + 2,
            paddingVertical: 3,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              lineHeight: 14,
              fontWeight: "600",
              color: theme.textMuted,
            }}
          >
            {t("history.moreItems", { count: moreCount })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Same badge style as list edit filters (`ListStatusFilterChips`). */
function SegmentedControl({
  value,
  onChange,
}: {
  value: ListsSegment;
  onChange: (id: ListsSegment) => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: spacing[4] }}
      contentContainerStyle={{
        gap: spacing[2],
        paddingRight: spacing[2],
      }}
    >
      {SEGMENTS.map((s) => {
        const selected = value === s.id;
        return (
          <Pressable
            key={s.id}
            onPress={() => onChange(s.id)}
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
              {t(s.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function HistoryCard({
  list,
  onOpenMenu,
  onPress,
  onTogglePreferred,
}: {
  list: ListCardModel;
  onOpenMenu: () => void;
  onPress?: () => void;
  onTogglePreferred: () => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const relativeLabels = {
    justNow: t("home.updatedJustNow"),
    minutes: (n: number) => t("home.updatedMinutes", { count: n }),
    hours: (n: number) => t("home.updatedHours", { count: n }),
    days: (n: number) => t("home.updatedDays", { count: n }),
  };

  const previewItems = list.previewItems ?? [];
  const moreCount = Math.max(0, list.itemCount - previewItems.length);

  const body = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing[3],
      }}
    >
      <ListBagIcon size={48} />

      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              ...typography.headline,
              color: theme.text,
              flex: 1,
              minWidth: 0,
              paddingRight: 4,
            }}
            numberOfLines={1}
          >
            {list.name}
          </Text>

          <Pressable
            onPress={onOpenMenu}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("history.actionsMenu")}
            style={{
              width: 36,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
              marginRight: -spacing[1],
            }}
          >
            <Text
              style={{
                fontSize: 22,
                lineHeight: 22,
                color: theme.textMuted,
                fontWeight: "600",
              }}
            >
              ⋯
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 2,
          }}
        >
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              flex: 1,
              minWidth: 0,
              paddingRight: 4,
            }}
            numberOfLines={1}
          >
            {formatRelativeUpdatedAt(list.updatedAt, relativeLabels)}
            {" · "}
            {t("home.productCount", { count: list.itemCount ?? 0 })}
          </Text>

          <Pressable
            onPress={onTogglePreferred}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              list.preferredForAi
                ? t("history.removeFromAi")
                : t("history.useForAi")
            }
            style={{
              width: 36,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
              marginRight: -spacing[1],
            }}
          >
            <FallbackSymbol
              fallback={list.preferredForAi ? "★" : "☆"}
              color={
                list.preferredForAi ? brand.starActive : theme.textMuted
              }
              size={20}
            />
          </Pressable>
        </View>

        <ProductBadges items={previewItems} moreCount={moreCount} />
      </View>
    </View>
  );

  const cardStyle = {
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: theme.border,
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={cardStyle}>
        {body}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{body}</View>;
}

export function HistoryScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const router = useRouter();
  const { segment: segmentParam } = useLocalSearchParams<{
    segment?: string | string[];
  }>();
  const { isSignedIn, getToken } = useAuth();
  const tabClearance = useTabBarClearance();
  const scrollRef = useRef<ScrollView>(null);
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<ListsSegment>("all");
  const [menuList, setMenuList] = useState<ListCardModel | null>(null);
  const [previewList, setPreviewList] = useState<ListCardModel | null>(null);
  const [deleteList, setDeleteList] = useState<ListCardModel | null>(null);
  const [preferredBusyId, setPreferredBusyId] = useState<string | null>(null);
  const [preferredSheet, setPreferredSheet] = useState<{
    visible: boolean;
    variant: PreferredForAiSheetVariant;
  }>({ visible: false, variant: "added" });
  const [feedback, setFeedback] = useState<
    | { kind: "limit" }
    | { kind: "restored" }
    | null
  >(null);
  const { showError } = useAppResult();

  const workspacesQuery = useWorkspaces();
  const { activeWorkspace, hydrated } = useActiveWorkspace(workspacesQuery.data);
  const workspaceId = activeWorkspace?.id ?? null;
  const queryClient = useQueryClient();

  // No mount/focus refetch here — keep cached lists visible; user pull refreshes.
  const listQueryOpts = {
    refetchOnMount: false as const,
    refetchOnWindowFocus: false as const,
  };
  const activeListsQuery = useShoppingLists(workspaceId, hydrated, listQueryOpts);
  const sessionsQuery = useResumableSessions(hydrated, listQueryOpts);
  const historyQuery = useHistoryLists(workspaceId, hydrated, listQueryOpts);
  const repeatMutation = useRepeatHistoryList(workspaceId);
  const restoreMutation = useRestoreHistoryList(workspaceId);
  const archiveMutation = useArchiveShoppingList(workspaceId);

  const countPreferredForAi = useCallback(() => {
    const active = activeListsQuery.data ?? [];
    const history = historyQuery.data ?? [];
    const ids = new Set<string>();
    for (const list of active) {
      if (list.preferredForAi) ids.add(list.id);
    }
    for (const list of history) {
      if (list.preferredForAi) ids.add(list.id);
    }
    return ids.size;
  }, [activeListsQuery.data, historyQuery.data]);

  const patchPreferredCaches = useCallback(
    (listId: string, preferredForAi: boolean) => {
      const patch = (lists: ShoppingList[] | undefined) => {
        if (!lists) return lists;
        return lists.map((list) =>
          list.id === listId ? { ...list, preferredForAi } : list,
        );
      };
      queryClient.setQueryData<ShoppingList[]>(
        ["shopping-lists", workspaceId],
        (prev) => patch(prev),
      );
      queryClient.setQueryData<ShoppingList[]>(
        ["shopping-lists-history", workspaceId],
        (prev) => patch(prev),
      );
      queryClient.setQueryData<ShoppingList>(["shopping-list", listId], (prev) =>
        prev ? { ...prev, preferredForAi } : prev,
      );
    },
    [queryClient, workspaceId],
  );

  const togglePreferredForAi = useCallback(
    async (list: ListCardModel): Promise<boolean> => {
      if (preferredBusyId) return false;
      const next = !list.preferredForAi;

      if (next && countPreferredForAi() >= MAX_PREFERRED_FOR_AI_LISTS) {
        setPreferredSheet({ visible: true, variant: "limit" });
        return false;
      }

      // Optimistic: star lights up / clears immediately, sheet opens with it.
      patchPreferredCaches(list.id, next);
      setPreferredSheet({
        visible: true,
        variant: next ? "added" : "removed",
      });
      setPreferredBusyId(list.id);

      try {
        const token = await getToken();
        if (!token) throw new Error("Missing auth token");
        await updateShoppingList(token, list.id, { preferredForAi: next });
        // Soft reconcile — UI already matches; keep caches fresh without blocking.
        void Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["shopping-lists", workspaceId],
          }),
          queryClient.invalidateQueries({
            queryKey: ["shopping-lists-history", workspaceId],
          }),
        ]);
        return true;
      } catch (err) {
        patchPreferredCaches(list.id, list.preferredForAi);
        setPreferredSheet({ visible: false, variant: next ? "added" : "removed" });

        const isLimit =
          err instanceof ApiClientError &&
          err.status === 409 &&
          err.details?.code === "PREFERRED_FOR_AI_LIMIT";
        if (isLimit) {
          setPreferredSheet({ visible: true, variant: "limit" });
          return false;
        }

        const description =
          err instanceof ApiClientError
            ? err.message
            : t("history.actionFailed");
        showError({
          title: t("history.actionFailedTitle"),
          description,
        });
        return false;
      } finally {
        setPreferredBusyId(null);
      }
    },
    [
      countPreferredForAi,
      getToken,
      patchPreferredCaches,
      preferredBusyId,
      queryClient,
      showError,
      t,
      workspaceId,
    ],
  );

  const resumableIds = useMemo(() => {
    const ids = new Set<string>();
    for (const session of sessionsQuery.data ?? []) {
      ids.add(session.listId);
    }
    return ids;
  }, [sessionsQuery.data]);

  const shoppingLists = useMemo((): ListCardModel[] => {
    return (activeListsQuery.data ?? [])
      .filter(
        (list) =>
          list.status === "active" &&
          (list.itemCount ?? 0) > 0 &&
          resumableIds.has(list.id),
      )
      .map((list) => ({
        id: list.id,
        name: list.name,
        itemCount: list.itemCount ?? 0,
        updatedAt: list.updatedAt,
        previewItems: list.previewItems ?? [],
        itemNames: list.itemNames ?? [],
        preferredForAi: list.preferredForAi ?? false,
        kind: "active" as const,
        group: "shopping" as const,
      }));
  }, [activeListsQuery.data, resumableIds]);

  const waitingLists = useMemo((): ListCardModel[] => {
    return (activeListsQuery.data ?? [])
      .filter(
        (list) =>
          list.status === "active" &&
          (list.itemCount ?? 0) > 0 &&
          !resumableIds.has(list.id),
      )
      .map((list) => ({
        id: list.id,
        name: list.name,
        itemCount: list.itemCount ?? 0,
        updatedAt: list.updatedAt,
        previewItems: list.previewItems ?? [],
        itemNames: list.itemNames ?? [],
        preferredForAi: list.preferredForAi ?? false,
        kind: "active" as const,
        group: "waiting" as const,
      }));
  }, [activeListsQuery.data, resumableIds]);

  const finishedLists = useMemo((): ListCardModel[] => {
    return (historyQuery.data ?? []).map((list) => ({
      id: list.id,
      name: list.name,
      itemCount: list.itemCount ?? 0,
      updatedAt: list.updatedAt,
      previewItems: list.previewItems ?? [],
      itemNames: list.itemNames ?? [],
      preferredForAi: list.preferredForAi ?? false,
      kind: "archived" as const,
      group: "finished" as const,
    }));
  }, [historyQuery.data]);

  const filteredShopping = useMemo(
    () => filterListsByQuery(shoppingLists, query),
    [shoppingLists, query],
  );
  const filteredWaiting = useMemo(
    () => filterListsByQuery(waitingLists, query),
    [waitingLists, query],
  );
  const filteredFinished = useMemo(
    () => filterListsByQuery(finishedLists, query),
    [finishedLists, query],
  );

  const segmentLists = useMemo(() => {
    if (segment === "shopping") return shoppingLists;
    if (segment === "waiting") return waitingLists;
    if (segment === "finished") return finishedLists;
    return [...shoppingLists, ...waitingLists, ...finishedLists];
  }, [segment, shoppingLists, waitingLists, finishedLists]);

  const filtered = useMemo(
    () => filterListsByQuery(segmentLists, query),
    [segmentLists, query],
  );

  /** All view: 20 per section. Single filter: 10. */
  const pageSize = segment === "all" ? 20 : 10;
  const paginationResetKey = `${segment}|${query}|${workspaceId ?? ""}`;

  const shoppingPage = useListPagination(filteredShopping, {
    pageSize,
    resetKey: paginationResetKey,
  });
  const waitingPage = useListPagination(filteredWaiting, {
    pageSize,
    resetKey: paginationResetKey,
  });
  const finishedPage = useListPagination(filteredFinished, {
    pageSize,
    resetKey: paginationResetKey,
  });
  const singlePage = useListPagination(filtered, {
    pageSize,
    resetKey: paginationResetKey,
  });

  const totalCount =
    shoppingLists.length + waitingLists.length + finishedLists.length;
  const filteredTotalCount =
    filteredShopping.length +
    filteredWaiting.length +
    filteredFinished.length;

  const loading =
    ((segment === "finished" || segment === "all") &&
      historyQuery.isLoading &&
      !historyQuery.data) ||
    ((segment === "shopping" ||
      segment === "waiting" ||
      segment === "all") &&
      activeListsQuery.isLoading &&
      !activeListsQuery.data);

  const loadError =
    ((segment === "finished" || segment === "all") && historyQuery.isError) ||
    ((segment === "shopping" || segment === "waiting" || segment === "all") &&
      activeListsQuery.isError);

  const refreshing =
    (activeListsQuery.isRefetching && !activeListsQuery.isLoading) ||
    (historyQuery.isRefetching && !historyQuery.isLoading) ||
    (sessionsQuery.isRefetching && !sessionsQuery.isLoading);

  const [pullRefreshing, setPullRefreshing] = useState(false);

  /** Background refetch with cache — text badge only (no spinner); pull uses RefreshControl. */
  const backgroundSyncing = refreshing && !loading && !pullRefreshing;

  const actionsBusy =
    (repeatMutation.isPending &&
      menuList != null &&
      repeatMutation.variables === menuList.id) ||
    (restoreMutation.isPending &&
      menuList != null &&
      restoreMutation.variables === menuList.id);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ["shopping-lists", workspaceId] }),
      queryClient.refetchQueries({
        queryKey: ["shopping-lists-history", workspaceId],
      }),
      queryClient.refetchQueries({
        queryKey: ["shopping-sessions", "resumable"],
      }),
    ]);
  }, [queryClient, workspaceId]);

  const onPullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setPullRefreshing(false);
    }
  }, [refreshAll]);

  // Apply deep-link segment from Home "see all" once per param change.
  useFocusEffect(
    useCallback(() => {
      const raw = Array.isArray(segmentParam) ? segmentParam[0] : segmentParam;
      const next = parseListsSegment(raw);
      if (!next) return;
      setSegment(next);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      });
    }, [segmentParam]),
  );

  useFocusEffect(
    useCallback(() => {
      historyOpened();
      // Heavy list/history queries: no forced focus refetch (pull-to-refresh + invalidation).
    }, []),
  );

  const handleLimitError = (err: unknown) => {
    if (err instanceof ApiClientError && err.code === "HISTORY_LIMIT_EXCEEDED") {
      setFeedback({ kind: "limit" });
      return;
    }
    Alert.alert(
      t("history.actionFailed"),
      err instanceof Error ? err.message : undefined,
    );
  };

  const onRepeat = (list: ListCardModel) => {
    historyRepeat(list.id);
    setMenuList(null);
    repeatMutation.mutate(list.id, {
      onSuccess: (created) => {
        historyRepeatCompleted({
          sourceListId: list.id,
          newListId: created.id,
        });
        router.push(`/list/${created.id}` as never);
      },
      onError: handleLimitError,
    });
  };

  const onRestore = (list: ListCardModel) => {
    setMenuList(null);
    restoreMutation.mutate(list.id, {
      onSuccess: () => {
        historyRestore(list.id);
        setFeedback({ kind: "restored" });
      },
      onError: handleLimitError,
    });
  };

  const onConfirmDelete = () => {
    if (!deleteList) return;
    const id = deleteList.id;
    archiveMutation.mutate(id, {
      onSuccess: () => {
        setDeleteList(null);
        void sessionsQuery.refetch();
      },
      onError: (err) => {
        Alert.alert(
          t("history.actionFailed"),
          err instanceof Error ? err.message : undefined,
        );
      },
    });
  };

  if (!isSignedIn) {
    return (
      <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
        <View style={{ flex: 1, padding: spacing[6], justifyContent: "center" }}>
          <Text style={{ ...typography.body, color: theme.textMuted }}>
            {t("history.signIn")}
          </Text>
        </View>
      </Screen>
    );
  }

  const emptyTitleKey =
    segment === "shopping"
      ? "history.emptyShoppingTitle"
      : segment === "waiting"
        ? "history.emptyWaitingTitle"
        : segment === "finished"
          ? "history.emptyTitle"
          : "history.emptyAllTitle";
  const emptyBodyKey =
    segment === "shopping"
      ? "history.emptyShoppingBody"
      : segment === "waiting"
        ? "history.emptyWaitingBody"
        : segment === "finished"
          ? "history.emptyBody"
          : "history.emptyAllBody";

  const isEmpty =
    !loading &&
    !loadError &&
    (segment === "all" ? totalCount === 0 : segmentLists.length === 0);

  const noSearchResults =
    !loading &&
    !loadError &&
    (segment === "all"
      ? totalCount > 0 && filteredTotalCount === 0
      : segmentLists.length > 0 && filtered.length === 0);

  const renderCard = (list: ListCardModel, openAsShopping: boolean) => (
    <HistoryCard
      key={list.id}
      list={list}
      onOpenMenu={() => setMenuList(list)}
      onTogglePreferred={() => {
        void togglePreferredForAi(list);
      }}
      onPress={
        list.kind === "active"
          ? () => {
              if (openAsShopping || list.group === "shopping") {
                router.push(`/list/${list.id}/shop` as never);
              } else {
                router.push(`/list/${list.id}` as never);
              }
            }
          : undefined
      }
    />
  );

  const renderSection = (
    titleKey: string,
    page: {
      visibleItems: ListCardModel[];
      hasMore: boolean;
      remainingCount: number;
      showMore: () => void;
      isLoadingMore: boolean;
    },
    openAsShopping: boolean,
    /** Full filtered length - hide section when empty before pagination. */
    totalInSection: number,
  ) => {
    if (totalInSection === 0) return null;
    return (
      <View key={titleKey} style={{ marginBottom: spacing[4] }}>
        <Text
          style={{
            ...typography.headline,
            color: theme.text,
            marginBottom: spacing[3],
          }}
        >
          {t(titleKey)}
        </Text>
        {page.visibleItems.map((list) => renderCard(list, openAsShopping))}
        <ShowMoreButton
          visible={page.hasMore}
          onPress={page.showMore}
          busy={page.isLoadingMore}
          remainingCount={page.remainingCount}
        />
      </View>
    );
  };

  const goHome = () => {
    goRoot();
  };

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.bg,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[2],
          }}
        >
          <Pressable
            onPress={goHome}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("auth.back")}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BackIcon size={20} />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing[2],
                minHeight: typography.headline.lineHeight,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  ...typography.headline,
                  color: theme.text,
                  flexShrink: 1,
                  includeFontPadding: false,
                }}
              >
                {t("history.title")}
              </Text>
              {backgroundSyncing ? (
                <View
                  accessibilityRole="text"
                  accessibilityLabel={t("offline.syncing")}
                  style={{
                    flexShrink: 0,
                    height: typography.headline.lineHeight,
                    justifyContent: "center",
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      ...typography.caption,
                      color: theme.textMuted,
                      lineHeight: typography.headline.lineHeight,
                      includeFontPadding: false,
                      textAlignVertical: "center",
                    }}
                  >
                    {t("offline.syncing")}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                marginTop: 2,
              }}
            >
              {t("history.subtitle")}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing[4],
          paddingTop: spacing[4],
          paddingBottom: tabClearance,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => void onPullRefresh()}
            tintColor={theme.primary}
          />
        }
      >
        <SegmentedControl value={segment} onChange={setSegment} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          onEndEditing={() => historySearch(query)}
          placeholder={t("history.searchPlaceholder")}
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: theme.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: theme.border,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            ...typography.body,
            color: theme.text,
            marginBottom: spacing[4],
          }}
        />

        <LoadingTransition
          variant="inline"
          loading={loading}
          skeleton={<ListsSkeleton multiSection={segment === "all"} />}
        >
        {loadError ? (
          <Text style={{ ...typography.body, color: theme.danger }}>
            {t("history.loadFailed")}
          </Text>
        ) : null}

        {!loadError && isEmpty ? (
          <FadeInContent visible={!loading && isEmpty}>
          <View style={{ alignItems: "center", paddingTop: spacing[8] }}>
            <KangurMascot variant="icon" width={88} height={88} />
            <Text
              style={{
                ...typography.headline,
                color: theme.text,
                marginTop: spacing[4],
                textAlign: "center",
              }}
            >
              {t(emptyTitleKey)}
            </Text>
            <Text
              style={{
                ...typography.body,
                color: theme.textMuted,
                marginTop: spacing[2],
                textAlign: "center",
              }}
            >
              {t(emptyBodyKey)}
            </Text>
          </View>
          </FadeInContent>
        ) : null}

        {noSearchResults ? (
          <Text
            style={{
              ...typography.body,
              color: theme.textMuted,
              textAlign: "center",
              marginTop: spacing[6],
            }}
          >
            {t("history.noResults")}
          </Text>
        ) : null}

        {!loadError && segment === "all" && !isEmpty
          ? (
              <>
                {renderSection(
                  "history.sectionShopping",
                  shoppingPage,
                  true,
                  filteredShopping.length,
                )}
                {renderSection(
                  "history.sectionWaiting",
                  waitingPage,
                  false,
                  filteredWaiting.length,
                )}
                {renderSection(
                  "history.sectionFinished",
                  finishedPage,
                  false,
                  filteredFinished.length,
                )}
              </>
            )
          : null}

        {!loadError && segment !== "all" ? (
          <>
            {singlePage.visibleItems.map((list) =>
              renderCard(list, segment === "shopping"),
            )}
            <ShowMoreButton
              visible={singlePage.hasMore}
              onPress={singlePage.showMore}
              busy={singlePage.isLoadingMore}
              remainingCount={singlePage.remainingCount}
            />
          </>
        ) : null}

        {!loadError &&
        activeWorkspace?.plan !== "premium" ? (
          <View style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>
            <PremiumHintRow
              title={t("billing.hintHistoryDepthLine1")}
              subtitle={t("billing.hintHistoryDepthLine2")}
              onPress={() => router.push("/premium")}
              accessibilityLabel={t("billing.upgradeCta")}
            />
          </View>
        ) : null}
        </LoadingTransition>
      </ScrollView>

      <HistoryActionsSheet
        visible={menuList != null}
        listName={menuList?.name ?? ""}
        preferredForAi={menuList?.preferredForAi ?? false}
        mode={
          menuList?.group === "shopping"
            ? "shopping"
            : menuList?.group === "waiting"
              ? "waiting"
              : "archived"
        }
        busy={actionsBusy || preferredBusyId === menuList?.id}
        onClose={() => setMenuList(null)}
        onPreview={() => {
          if (!menuList) return;
          const list = menuList;
          setMenuList(null);
          setPreviewList(list);
        }}
        onEdit={() => {
          if (!menuList) return;
          const listId = menuList.id;
          setMenuList(null);
          router.push(`/list/${listId}` as never);
        }}
        onShop={() => {
          if (!menuList) return;
          const listId = menuList.id;
          setMenuList(null);
          router.push(`/list/${listId}/shop` as never);
        }}
        onRepeat={() => {
          if (menuList) onRepeat(menuList);
        }}
        onRestore={() => {
          if (menuList) onRestore(menuList);
        }}
        onTogglePreferred={() => {
          if (!menuList) return;
          const list = menuList;
          setMenuList((current) =>
            current?.id === list.id
              ? { ...current, preferredForAi: !list.preferredForAi }
              : current,
          );
          void togglePreferredForAi(list).then((ok) => {
            if (ok) return;
            // Revert menu row if blocked (limit) or failed.
            setMenuList((current) =>
              current?.id === list.id
                ? { ...current, preferredForAi: list.preferredForAi }
                : current,
            );
          });
        }}
        onDelete={() => {
          if (!menuList) return;
          const list = menuList;
          setMenuList(null);
          setDeleteList(list);
        }}
      />

      <HistoryPreviewSheet
        visible={previewList != null}
        listId={previewList?.id ?? null}
        listName={previewList?.name ?? ""}
        allowArchived={previewList?.kind === "archived"}
        onClose={() => setPreviewList(null)}
      />

      <PreferredForAiSheet
        visible={preferredSheet.visible}
        variant={preferredSheet.variant}
        onClose={() =>
          setPreferredSheet((current) => ({ ...current, visible: false }))
        }
      />

      <DeleteListDialog
        visible={deleteList != null}
        listName={deleteList?.name ?? ""}
        busy={archiveMutation.isPending}
        onCancel={() => {
          if (!archiveMutation.isPending) setDeleteList(null);
        }}
        onConfirm={onConfirmDelete}
      />

      <FeedbackSheet
        visible={feedback != null}
        image={
          feedback?.kind === "restored"
            ? brandAssets.listCreated
            : brandAssets.listBag
        }
        title={
          feedback?.kind === "restored"
            ? t("history.restoredTitle")
            : t("history.limitTitle")
        }
        body={
          feedback?.kind === "restored"
            ? t("history.restoredBody")
            : t("history.limitBody")
        }
        primaryLabel={
          feedback?.kind === "limit"
            ? t("billing.upgradeCta")
            : t("common.return")
        }
        onPrimary={() => {
          const kind = feedback?.kind;
          setFeedback(null);
          if (kind === "limit") {
            router.push("/premium");
          }
        }}
        secondaryLabel={
          feedback?.kind === "limit" ? t("common.return") : undefined
        }
        onSecondary={
          feedback?.kind === "limit" ? () => setFeedback(null) : undefined
        }
      />
    </Screen>
  );
}
