import { useAuth } from "@clerk/clerk-expo";
import { type ShoppingCategory } from "@shared/shopping-categories";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { shoppingDensity } from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { OfflineStatusBanner } from "@/features/offline/OfflineStatusBanner";
import { startShoppingSession } from "@/features/notifications/api";
import type { ShoppingItem } from "@/features/shopping-item/schemas";
import { useShoppingItems } from "@/features/shopping-item/useShoppingItems";
import { useShoppingSession } from "@/features/shopping-list/session/useShoppingSession";
import { notifyFinishedForActiveSession } from "@/features/shopping-list/session/notify-finished";
import { useShoppingList } from "@/features/shopping-list/useShoppingLists";
import { useWorkspaceMembers } from "@/features/workspace/useWorkspaceMembers";
import { createClientId } from "@/lib/createClientId";
import { formatRelativeUpdatedAt } from "@/lib/formatRelativeUpdatedAt";
import { RemoteChangeToast, useListRealtime } from "@/lib/realtime";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddItemSheet } from "./add-item-sheet";
import {
  getActiveCategoryProgress,
  getCompletedCategoryProgress,
  getListShoppingProgress,
} from "./category-progress";
import { ShoppingCategoryCard } from "./shopping-category-card";
import { ShoppingFab } from "./shopping-fab";
import { ShoppingListSummaryCard } from "./shopping-list-summary-card";
import { useShoppingModeExitGuard } from "./shopping-mode-exit-guard";

type Props = {
  listId: string;
};

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
  const itemsQuery = useShoppingItems(listId);
  const membersQuery = useWorkspaceMembers(listQuery.data?.workspaceId ?? null);
  const session = useShoppingSession(listId);
  const [addOpen, setAddOpen] = useState(false);
  const [fabVisible, setFabVisible] = useState(true);
  const lastScrollY = useRef(0);
  const startedRef = useRef(false);

  useListRealtime(listId, {
    workspaceId: listQuery.data?.workspaceId ?? null,
  });

  const { allowLeave, exitDialog } = useShoppingModeExitGuard(true);

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
        await session.start(listQuery.data!.workspaceId);
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

  const categories = useMemo(
    () => getActiveCategoryProgress(items),
    [items],
  );

  const completedCategories = useMemo(
    () => getCompletedCategoryProgress(items),
    [items],
  );

  const listProgress = useMemo(() => getListShoppingProgress(items), [items]);

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
    router.push(`/list/${listId}/shop/${category}`);
  };

  if (listQuery.isPending || itemsQuery.isPending) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.section,
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const showFinishCta = categories.length === 0;

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
                if (router.canGoBack()) router.back();
                else {
                  allowLeave();
                  router.replace(`/list/${listId}`);
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
          style={{
            bottom: 0,
            paddingBottom: spacing[2] + insets.bottom,
          }}
        />
        <ScrollView
          contentContainerStyle={{
            padding: spacing[6],
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
        <ShoppingListSummaryCard
          title={listQuery.data?.name ?? t("shoppingMode.title")}
          updatedLabel={updatedLabel}
          bought={listProgress.bought}
          total={listProgress.total}
          progress={listProgress.progress}
          members={membersQuery.data ?? []}
        />

        {categories.length > 0 ? (
          <View style={{ marginBottom: spacing[2] }}>
            <SectionTitle>{t("shoppingMode.categoriesSection")}</SectionTitle>
            {categories.map((cat) => (
              <ShoppingCategoryCard
                key={cat.category}
                cat={cat}
                variant="active"
                onPress={openCategory}
              />
            ))}
          </View>
        ) : null}

        {completedCategories.length > 0 ? (
          <View style={{ marginTop: categories.length > 0 ? spacing[4] : 0 }}>
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
                router.push(`/list/${listId}/shop/finish`);
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
      </ScrollView>

      <ShoppingFab
        visible={fabVisible}
        expanded={fabVisible}
        onPress={() => setAddOpen(true)}
      />
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
            ["shopping-items", listId],
            (prev) => [...(prev ?? []), optimistic],
          );
          void session.addItem({ ...input, clientId });
        }}
      />

      {exitDialog}
    </View>
  );
}
