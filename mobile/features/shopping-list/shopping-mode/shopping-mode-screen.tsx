import {
  getShoppingCategoryIcon,
  type ShoppingCategory,
} from "@shared/shopping-categories";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { shoppingDensity } from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { OfflineStatusBanner } from "@/features/offline/OfflineStatusBanner";
import type { ShoppingItem } from "@/features/shopping-item/schemas";
import { useShoppingItems } from "@/features/shopping-item/useShoppingItems";
import { useShoppingSession } from "@/features/shopping-list/session/useShoppingSession";
import { useShoppingList } from "@/features/shopping-list/useShoppingLists";
import { createClientId } from "@/lib/createClientId";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddItemSheet } from "./add-item-sheet";
import { getActiveCategoryProgress } from "./category-progress";
import { CategoryProgressBar } from "./category-progress-bar";
import { SearchSlot, ShoppingHomeHeader } from "./shopping-home-header";
import { ShoppingFab } from "./shopping-fab";
import { useShoppingModeExitGuard } from "./shopping-mode-exit-guard";

type Props = {
  listId: string;
};

export function ShoppingModeScreen({ listId }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const listQuery = useShoppingList(listId);
  const itemsQuery = useShoppingItems(listId);
  const session = useShoppingSession(listId);
  const [addOpen, setAddOpen] = useState(false);
  const [fabVisible, setFabVisible] = useState(true);
  const lastScrollY = useRef(0);
  const startedRef = useRef(false);

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
      void session.start(listQuery.data.workspaceId).then(() => {
        void queryClient.invalidateQueries({
          queryKey: ["shopping-sessions", "resumable"],
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once after hydrate
  }, [session.hydrated, listQuery.data?.workspaceId]);

  const categories = useMemo(
    () => getActiveCategoryProgress(itemsQuery.data ?? []),
    [itemsQuery.data],
  );

  const remaining = useMemo(
    () => (itemsQuery.data ?? []).filter((i) => i.status === "pending").length,
    [itemsQuery.data],
  );

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.section }}>
      <OfflineStatusBanner listId={listId} />
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
        <ShoppingHomeHeader
          title={listQuery.data?.name ?? t("shoppingMode.title")}
          remaining={remaining}
        />
        <SearchSlot />

        {categories.length === 0 ? (
          <View style={{ marginTop: spacing[8], alignItems: "center" }}>
            <Text style={{ ...typography.headline, color: theme.text }}>
              {t("shoppingMode.allDone")}
            </Text>
            <Pressable
              onPress={() => {
                allowLeave();
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
        ) : (
          categories.map((cat) => (
            <Pressable
              key={cat.category}
              onPress={() => openCategory(cat.category)}
              style={{
                marginBottom: spacing[3],
                padding: spacing[4],
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                minHeight: shoppingDensity.categoryRowMinHeight,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Text style={{ fontSize: 28 }}>
                  {getShoppingCategoryIcon(cat.category)}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.headline, color: theme.text }}>
                    {t(`categories.${cat.category}`)}
                  </Text>
                  <Text
                    style={{ ...typography.caption, color: theme.textMuted }}
                  >
                    {t("shoppingMode.leftCount", { count: cat.activeCount })}
                  </Text>
                  <CategoryProgressBar progress={cat.progress} />
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <ShoppingFab
        visible={fabVisible}
        expanded={fabVisible}
        onPress={() => setAddOpen(true)}
      />

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
