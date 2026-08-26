import { useAuth } from "@clerk/clerk-expo";
import {
  mergeActiveCategoryOrder,
  resolveShoppingCategoryOrder,
  type ShoppingCategory,
} from "@shared/shopping-categories";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

import { ShoppingModeSkeleton } from "@/components/skeleton";
import { useColorScheme } from "@/components/useColorScheme";
import { shoppingDensity } from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { LoadingTransition } from "@/lib/motion";
import { BackIcon } from "@/features/auth/auth-icons";
import { OfflineStatusBanner } from "@/features/offline/OfflineStatusBanner";
import { startShoppingSession } from "@/features/notifications/api";
import { ListItemRow } from "@/features/shopping-item/list-item-row";
import { shoppingItemsQueryKey } from "@/features/shopping-item/query-keys";
import type {
  ItemStatus,
  ShoppingItem,
} from "@/features/shopping-item/schemas";
import { useShoppingItems } from "@/features/shopping-item/useShoppingItems";
import { CategoryOrderHint } from "@/features/shopping-list/category-order-ui";
import { CategoryReorderList } from "@/features/shopping-list/category-reorder-list";
import { NestableScreenScroll } from "@/features/shopping-list/nestable-screen-scroll";
import { useShoppingSession } from "@/features/shopping-list/session/useShoppingSession";
import { notifyFinishedForActiveSession } from "@/features/shopping-list/session/notify-finished";
import {
  useShoppingList,
  useUpdateShoppingList,
} from "@/features/shopping-list/useShoppingLists";
import { useWorkspaceMembers } from "@/features/workspace/useWorkspaceMembers";
import { createClientId } from "@/lib/createClientId";
import { formatRelativeUpdatedAt } from "@/lib/formatRelativeUpdatedAt";
import { Analytics } from "@/lib/analytics";
import { oncePerUser } from "@/lib/analytics/once";
import { openTask } from "@/lib/navigation";
import { RemoteChangeToast, useListRealtime } from "@/lib/realtime";

import { AddItemSheet } from "./add-item-sheet";
import {
  getActiveCategoryProgress,
  getCompletedCategoryProgress,
  getListShoppingProgress,
  type CategoryProgress,
} from "./category-progress";
import { ShoppingBrowseModeToggle } from "./shopping-browse-mode-toggle";
import { ShoppingCategoryCard } from "./shopping-category-card";
import { ShoppingFab } from "./shopping-fab";
import { ShoppingListSummaryCard } from "./shopping-list-summary-card";
import { useShoppingModeExitGuard } from "./shopping-mode-exit-guard";
import { leaveShoppingTask } from "./shopping-task-intent";
import { useShoppingBrowseMode } from "./useShoppingBrowseMode";

type Props = {
  listId: string;
};

function nextCycleStatus(
  status: ItemStatus,
): "pending" | "bought" | "unavailable" {
  if (status === "pending") return "bought";
  if (status === "bought") return "unavailable";
  return "pending";
}

function SectionTitleRow({
  title,
  trailing,
}: {
  title: string;
  trailing?: ReactNode;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing[3],
        marginBottom: spacing[3],
      }}
    >
      <Text
        style={{
          ...typography.headline,
          color: theme.text,
          flexShrink: 1,
        }}
      >
        {title}
      </Text>
      {trailing}
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Text
      style={{
        ...typography.headline,
        color: theme.text,
        marginBottom: spacing[3],
      }}
    >
      {children}
    </Text>
  );
}

export function ShoppingModeScreen({ listId }: Props) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const listQuery = useShoppingList(listId);
  const updateList = useUpdateShoppingList(listId);
  const itemsQuery = useShoppingItems(listId);
  const membersQuery = useWorkspaceMembers(listQuery.data?.workspaceId ?? null);
  const session = useShoppingSession(listId);
  const { mode: browseMode, setMode: setBrowseMode } = useShoppingBrowseMode();
  const [addOpen, setAddOpen] = useState(false);
  const [fabVisible, setFabVisible] = useState(true);
  const lastScrollY = useRef(0);
  const startedRef = useRef(false);

  useListRealtime(listId, {
    workspaceId: listQuery.data?.workspaceId ?? null,
    cadence: "shopping",
  });

  const { allowLeave, exitDialog } = useShoppingModeExitGuard(true, listId, {
    onLeave: () => {
      const workspaceId = listQuery.data?.workspaceId;
      if (!workspaceId) return;
      const count = (itemsQuery.data ?? []).filter(
        (i) => i.status !== "removed",
      ).length;
      Analytics.track("shopping_cancelled", {
        workspace_id: workspaceId,
        list_id: listId,
        item_count: count,
      });
    },
  });

  useEffect(() => {
    void activateKeepAwakeAsync("shopping-mode");
    return () => {
      void deactivateKeepAwake("shopping-mode");
    };
  }, []);

  useEffect(() => {
    if (
      session.hydrated &&
      listQuery.data?.workspaceId &&
      !startedRef.current
    ) {
      startedRef.current = true;
      void (async () => {
        const workspaceId = listQuery.data!.workspaceId;
        await session.start(workspaceId);
        const itemCount = (itemsQuery.data ?? []).filter(
          (i) => i.status !== "removed",
        ).length;
        Analytics.track("shopping_started", {
          workspace_id: workspaceId,
          list_id: listId,
          item_count: itemCount,
        });
        void oncePerUser("first_shopping_session", () => {
          Analytics.track("first_shopping_session", {
            workspace_id: workspaceId,
            list_id: listId,
          });
        });
        try {
          const token = await getToken();
          if (!token) return;
          const remote = await startShoppingSession(token, listId, {
            clientPlatform:
              Platform.OS === "ios"
                ? "ios"
                : Platform.OS === "android"
                  ? "android"
                  : "web",
          });
          await session.setServerSessionId(remote.id);
        } catch (error) {
          console.info("[shopping]", "ServerSessionStartSkipped", error);
        }
        void queryClient.invalidateQueries({
          queryKey: ["shopping-sessions", "resumable"],
        });
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once after hydrate
  }, [session.hydrated, listQuery.data?.workspaceId]);

  const items = useMemo(
    () => itemsQuery.data ?? [],
    [itemsQuery.data],
  );

  const listCategoryOrder = listQuery.data?.categoryOrder;

  const categories = useMemo(
    () => getActiveCategoryProgress(items, listCategoryOrder),
    [items, listCategoryOrder],
  );

  const completedCategories = useMemo(
    () => getCompletedCategoryProgress(items, listCategoryOrder),
    [items, listCategoryOrder],
  );

  const listProgress = useMemo(() => getListShoppingProgress(items), [items]);

  const flatSortedItems = useMemo(() => {
    const categoryOrder = resolveShoppingCategoryOrder(listCategoryOrder);
    return items
      .filter((item) => item.status !== "removed")
      .slice()
      .sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a.category);
        const bIndex = categoryOrder.indexOf(b.category);
        const byCat =
          (aIndex === -1 ? categoryOrder.length : aIndex) -
          (bIndex === -1 ? categoryOrder.length : bIndex);
        if (byCat !== 0) return byCat;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
  }, [items, listCategoryOrder]);

  const patchCacheStatus = useCallback(
    (itemId: string, status: ShoppingItem["status"]) => {
      queryClient.setQueryData<ShoppingItem[]>(
        shoppingItemsQueryKey(listId, "active"),
        (prev) =>
          prev?.map((i) => (i.id === itemId ? { ...i, status } : i)) ?? prev,
      );
    },
    [listId, queryClient],
  );

  const cycleItemStatus = useCallback(
    async (item: ShoppingItem) => {
      const cached = queryClient.getQueryData<ShoppingItem[]>(
        shoppingItemsQueryKey(listId, "active"),
      );
      const latest =
        cached?.find((row) => row.id === item.id) ?? item;
      const next = nextCycleStatus(latest.status);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      patchCacheStatus(item.id, next);
      await session.setItemStatus(item.id, next);
    },
    [listId, patchCacheStatus, queryClient, session],
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

  const updatedLabel = listQuery.data?.updatedAt
    ? t("home.updatedPrefix", {
        time: formatRelativeUpdatedAt(listQuery.data.updatedAt, relativeLabels),
      })
    : "";

  const openCategory = (category: ShoppingCategory) => {
    allowLeave();
    openTask(`/list/${listId}/shop/${category}`);
  };

  const goBackToEdit = () => {
    // Intentional return to list editor — no exit confirmation sheet.
    allowLeave();
    leaveShoppingTask(listId);
  };

  const onReorderCategories = (data: CategoryProgress[]) => {
    const fullOrder = resolveShoppingCategoryOrder(listCategoryOrder);
    const newActive = data.map((c) => c.category);
    const nextOrder = mergeActiveCategoryOrder(fullOrder, newActive);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateList.mutate({ categoryOrder: nextOrder });
  };

  const isPending = listQuery.isPending || itemsQuery.isPending;
  const showFinishCta = !isPending && categories.length === 0;
  const hasTrackedItems = flatSortedItems.length > 0;
  const showBrowseSection =
    browseMode === "list" ? hasTrackedItems : categories.length > 0;

  const backToEditLink = (
    <Pressable
      onPress={goBackToEdit}
      accessibilityRole="button"
      accessibilityLabel={t("shoppingMode.backToEditList")}
      style={{
        marginTop: spacing[4],
        paddingVertical: spacing[3],
        alignItems: "center",
      }}
    >
      <Text
        style={{
          ...typography.label,
          fontWeight: "500",
          color: theme.textMuted,
        }}
      >
        {t("shoppingMode.backToEditList")}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.section }}>
      <RemoteChangeToast />
      <View style={{ paddingTop: insets.top, backgroundColor: theme.bg }}>
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
              onPress={() => {
                // Header back = same as Android back → confirm exit sheet.
                // (Intentional "back to edit" uses goBackToEdit without sheet.)
                if (router.canGoBack()) {
                  router.back();
                } else {
                  allowLeave();
                  leaveShoppingTask(listId);
                }
              }}
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
              <Text
                numberOfLines={1}
                style={{ ...typography.headline, color: theme.text }}
              >
                {t("shoppingMode.continueShopping")}
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  marginTop: 2,
                }}
                numberOfLines={2}
              >
                {t("shoppingMode.continueShoppingSubtitle")}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <OfflineStatusBanner
          listId={listId}
          overlay
          bottom
          quietSetStatus
          style={{
            bottom: 0,
            paddingBottom: spacing[2] + insets.bottom,
          }}
        />
        {!isPending ? (
          <View
            style={{
              paddingHorizontal: spacing[6],
              paddingTop: spacing[6],
              backgroundColor: theme.section,
            }}
          >
            <ShoppingListSummaryCard
              title={listQuery.data?.name ?? t("shoppingMode.title")}
              updatedLabel={updatedLabel}
              bought={listProgress.bought}
              total={listProgress.total}
              progress={listProgress.progress}
              members={membersQuery.data ?? []}
            />
          </View>
        ) : null}
        <NestableScreenScroll
          contentContainerStyle={{
            paddingHorizontal: spacing[6],
            paddingTop: isPending ? spacing[6] : 0,
            paddingBottom: 100 + insets.bottom,
          }}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            if (y > lastScrollY.current + 8) setFabVisible(false);
            else if (y < lastScrollY.current - 8) setFabVisible(true);
            lastScrollY.current = y;
          }}
          scrollEventThrottle={16}
        >
          <LoadingTransition
            variant="inline"
            loading={isPending}
            skeleton={<ShoppingModeSkeleton />}
          >
              {showBrowseSection ? (
                <View style={{ marginBottom: spacing[2] }}>
                  <SectionTitleRow
                    title={t(
                      browseMode === "list"
                        ? "shoppingMode.listSection"
                        : "shoppingMode.categoriesSection",
                    )}
                    trailing={
                      <ShoppingBrowseModeToggle
                        mode={browseMode}
                        onChange={setBrowseMode}
                      />
                    }
                  />

                  {browseMode === "list" ? (
                    <>
                      <CategoryOrderHint>
                        {t("shoppingMode.listTapHint")}
                      </CategoryOrderHint>
                      {flatSortedItems.map((item, index) => (
                        <ListItemRow
                          key={item.id}
                          item={item}
                          showDivider={index < flatSortedItems.length - 1}
                          onPress={() => void cycleItemStatus(item)}
                        />
                      ))}
                      {backToEditLink}
                    </>
                  ) : (
                    <>
                      <CategoryOrderHint>
                        {t("shoppingMode.tapCategoryHint")}
                      </CategoryOrderHint>
                      <CategoryOrderHint>
                        {t(
                          Platform.OS === "web"
                            ? "shoppingMode.categoryOrderHintWeb"
                            : "shoppingMode.categoryOrderHint",
                        )}
                      </CategoryOrderHint>
                      <CategoryReorderList
                        data={categories}
                        keyExtractor={(item) => item.category}
                        onReorder={onReorderCategories}
                        renderItem={({
                          item,
                          drag,
                          isActive,
                          moveUp,
                          moveDown,
                        }) => (
                          <ShoppingCategoryCard
                            cat={item}
                            variant="active"
                            onPress={openCategory}
                            onDrag={drag}
                            isDragging={isActive}
                            moveUp={moveUp}
                            moveDown={moveDown}
                          />
                        )}
                      />
                      {backToEditLink}
                    </>
                  )}
                </View>
              ) : (
                <View style={{ marginBottom: spacing[2] }}>
                  {hasTrackedItems ? (
                    <SectionTitleRow
                      title={t(
                        browseMode === "list"
                          ? "shoppingMode.listSection"
                          : "shoppingMode.categoriesSection",
                      )}
                      trailing={
                        <ShoppingBrowseModeToggle
                          mode={browseMode}
                          onChange={setBrowseMode}
                        />
                      }
                    />
                  ) : null}
                  {backToEditLink}
                </View>
              )}

              {browseMode === "aisles" && completedCategories.length > 0 ? (
                <View
                  style={{
                    marginTop: showBrowseSection ? spacing[4] : 0,
                  }}
                >
                  <SectionTitle>
                    {t("shoppingMode.alreadyBoughtSection")}
                  </SectionTitle>
                  {completedCategories.map((cat) => (
                    <ShoppingCategoryCard
                      key={`done-${cat.category}`}
                      cat={cat}
                      variant="completed"
                      onPress={openCategory}
                    />
                  ))}
                </View>
              ) : null}

              {showFinishCta ? (
                <View
                  style={{
                    marginTop: spacing[6],
                    alignItems: "center",
                  }}
                >
                  <Text style={{ ...typography.headline, color: theme.text }}>
                    {t("shoppingMode.allDone")}
                  </Text>
                  <Pressable
                    onPress={() => {
                      allowLeave();
                      const unavailable = (itemsQuery.data ?? []).filter(
                        (i) => i.status === "unavailable",
                      ).length;
                      void notifyFinishedForActiveSession(
                        listId,
                        getToken,
                        unavailable,
                      );
                      openTask(`/list/${listId}/shop/finish`);
                    }}
                    style={{
                      marginTop: spacing[6],
                      backgroundColor: theme.primary,
                      borderRadius: radius.md,
                      paddingVertical: spacing[4],
                      paddingHorizontal: spacing[8],
                      minHeight: shoppingDensity.primaryCtaMinHeight,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ ...typography.label, color: "#fff" }}>
                      {t("shoppingMode.finishShopping")}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
          </LoadingTransition>
        </NestableScreenScroll>

        {!isPending ? (
          <ShoppingFab
            visible={fabVisible}
            expanded={fabVisible}
            onPress={() => setAddOpen(true)}
          />
        ) : null}
      </View>

      <AddItemSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(input) => {
          const clientId = createClientId();
          const optimistic: ShoppingItem = {
            id: clientId,
            clientId,
            listId,
            name: input.name,
            normalizedName: input.name.toLowerCase(),
            amount: input.amount ?? null,
            note: input.note ?? null,
            category: input.category,
            status: "pending",
            sortOrder: 9999,
            addedByUserId: "",
            updatedByUserId: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          queryClient.setQueryData<ShoppingItem[]>(
            shoppingItemsQueryKey(listId, "active"),
            (prev) => [...(prev ?? []), optimistic],
          );
          void session.addItem({ ...input, clientId });
        }}
      />

      {exitDialog}
    </View>
  );
}
