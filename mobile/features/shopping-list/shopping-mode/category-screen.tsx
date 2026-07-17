import {
  getShoppingCategoryIcon,
  isShoppingCategory,
  type ShoppingCategory,
} from "@shared/shopping-categories";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

import { useColorScheme } from "@/components/useColorScheme";
import { shoppingDensity } from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import type { ShoppingItem } from "@/features/shopping-item/schemas";
import {
  useShoppingItems,
} from "@/features/shopping-item/useShoppingItems";
import { OfflineStatusBanner } from "@/features/offline/OfflineStatusBanner";
import { useShoppingSession } from "@/features/shopping-list/session/useShoppingSession";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  nextCategoryWithActive,
  sortItemsInCategory,
} from "./category-progress";
import { SwipeableItemRow } from "./swipeable-item-row";
import { useShoppingModeExitGuard } from "./shopping-mode-exit-guard";

type UndoSnapshot = {
  item: ShoppingItem;
  previousStatus: ShoppingItem["status"];
  index: number;
};

type Props = {
  listId: string;
  category: string;
};

export function ShoppingCategoryScreen({ listId, category: categoryParam }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const itemsQuery = useShoppingItems(listId);
  const session = useShoppingSession(listId);
  const [undo, setUndo] = useState<UndoSnapshot | null>(null);
  const [purchasedExpanded, setPurchasedExpanded] = useState(true);
  const [unavailableExpanded, setUnavailableExpanded] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { allowLeave } = useShoppingModeExitGuard(true);

  const category: ShoppingCategory | null = isShoppingCategory(categoryParam)
    ? categoryParam
    : null;

  const catItems = useMemo(() => {
    if (!category || !itemsQuery.data) return [];
    return sortItemsInCategory(
      itemsQuery.data.filter(
        (i) => i.category === category && i.status !== "removed",
      ),
    );
  }, [category, itemsQuery.data]);

  const active = catItems.filter((i) => i.status === "pending");
  const purchased = catItems.filter((i) => i.status === "bought");
  const unavailable = catItems.filter((i) => i.status === "unavailable");

  const next = useMemo(
    () =>
      category && itemsQuery.data
        ? nextCategoryWithActive(itemsQuery.data, category)
        : null,
    [category, itemsQuery.data],
  );

  const patchCacheStatus = useCallback(
    (itemId: string, status: ShoppingItem["status"]) => {
      queryClient.setQueryData<ShoppingItem[]>(
        ["shopping-items", listId],
        (prev) =>
          prev?.map((i) => (i.id === itemId ? { ...i, status } : i)) ?? prev,
      );
    },
    [listId, queryClient],
  );

  const showUndo = (snapshot: UndoSnapshot) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(snapshot);
    undoTimer.current = setTimeout(() => setUndo(null), 4000);
  };

  const applyStatus = async (
    item: ShoppingItem,
    index: number,
    status: "bought" | "unavailable",
  ) => {
    showUndo({ item, previousStatus: item.status, index });
    patchCacheStatus(item.id, status);
    await session.setItemStatus(item.id, status);
  };

  const restoreUndo = async (snapshot: UndoSnapshot) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(null);
    patchCacheStatus(snapshot.item.id, snapshot.previousStatus);
    await session.setItemStatus(snapshot.item.id, snapshot.previousStatus);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  if (!category) {
    return (
      <View style={{ flex: 1, padding: spacing[6], backgroundColor: theme.section }}>
        <Text style={{ color: theme.danger }}>{t("shoppingMode.invalidCategory")}</Text>
      </View>
    );
  }

  if (itemsQuery.isPending) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.section }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.section }}>
      <OfflineStatusBanner listId={listId} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: spacing[6], paddingBottom: 120 }}
      >
        <Text style={{ fontSize: 36 }}>{getShoppingCategoryIcon(category)}</Text>
        <Text style={{ ...typography.title, color: theme.text, marginTop: spacing[2] }}>
          {t(`categories.${category}`)}
        </Text>
        <Text style={{ ...typography.caption, color: theme.textMuted, marginTop: spacing[1] }}>
          {t("shoppingMode.leftCount", { count: active.length })}
        </Text>

        <View style={{ marginTop: spacing[6] }}>
          {active.map((item, index) => (
            <SwipeableItemRow
              key={item.id}
              item={item}
              index={index}
              onPurchase={(it, idx) => void applyStatus(it, idx, "bought")}
              onUnavailable={(it, idx) => void applyStatus(it, idx, "unavailable")}
            />
          ))}
        </View>

        {active.length === 0 ? (
          <View style={{ marginTop: spacing[8], alignItems: "center" }}>
            <Text style={{ fontSize: 40 }}>🎉</Text>
            <Text
              style={{
                ...typography.headline,
                color: theme.text,
                marginTop: spacing[3],
                textAlign: "center",
              }}
            >
              {t("shoppingMode.categoryComplete", {
                category: t(`categories.${category}`),
              })}
            </Text>
          </View>
        ) : null}

        {purchased.length > 0 ? (
          <View style={{ marginTop: spacing[8] }}>
            <Pressable onPress={() => setPurchasedExpanded((v) => !v)}>
              <Text style={{ ...typography.label, color: theme.textMuted }}>
                {purchasedExpanded ? "▾" : "▸"} {t("shoppingMode.purchased")} ({purchased.length})
              </Text>
            </Pressable>
            {purchasedExpanded
              ? purchased.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: shoppingDensity.historyRowMinHeight,
                      marginTop: spacing[2],
                    }}
                  >
                    <Text style={{ ...typography.body, color: theme.textMuted }}>
                      ✓ {item.name}
                    </Text>
                    <Pressable
                      onPress={() =>
                        void restoreUndo({
                          item,
                          previousStatus: "pending",
                          index: 0,
                        })
                      }
                      hitSlop={12}
                    >
                      <Text style={{ ...typography.caption, color: theme.primary }}>
                        {t("shoppingMode.undo")}
                      </Text>
                    </Pressable>
                  </View>
                ))
              : null}
          </View>
        ) : null}

        {unavailable.length > 0 ? (
          <View style={{ marginTop: spacing[6] }}>
            <Pressable onPress={() => setUnavailableExpanded((v) => !v)}>
              <Text style={{ ...typography.label, color: theme.textMuted }}>
                {unavailableExpanded ? "▾" : "▸"} {t("shoppingMode.unavailable")} ({unavailable.length})
              </Text>
            </Pressable>
            {unavailableExpanded
              ? unavailable.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: shoppingDensity.historyRowMinHeight,
                      marginTop: spacing[2],
                    }}
                  >
                    <Text style={{ ...typography.body, color: theme.textMuted }}>
                      – {item.name}
                    </Text>
                    <Pressable
                      onPress={() =>
                        void restoreUndo({
                          item,
                          previousStatus: "pending",
                          index: 0,
                        })
                      }
                      hitSlop={12}
                    >
                      <Text style={{ ...typography.caption, color: theme.primary }}>
                        {t("shoppingMode.undo")}
                      </Text>
                    </Pressable>
                  </View>
                ))
              : null}
          </View>
        ) : null}
      </ScrollView>

      {active.length === 0 ? (
        <View
          style={{
            padding: spacing[6],
            paddingBottom: spacing[6] + insets.bottom,
            gap: spacing[3],
            borderTopWidth: 1,
            borderTopColor: theme.border,
          }}
        >
          <Pressable
            onPress={() => {
              allowLeave();
              if (next) {
                router.replace(`/list/${listId}/shop/${next.category}`);
              } else {
                router.push(`/list/${listId}/shop/finish`);
              }
            }}
            style={{
              backgroundColor: theme.primary,
              borderRadius: radius.md,
              paddingVertical: spacing[4],
              alignItems: "center",
              minHeight: shoppingDensity.primaryCtaMinHeight,
              justifyContent: "center",
            }}
          >
            <Text style={{ ...typography.label, color: "#fff" }}>
              {next
                ? t("shoppingMode.continueTo", {
                    category: t(`categories.${next.category}`),
                    count: next.activeCount,
                  })
                : t("shoppingMode.finishShopping")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              allowLeave();
              router.back();
            }}
            style={{ paddingVertical: spacing[3], alignItems: "center" }}
          >
            <Text style={{ ...typography.label, color: theme.textMuted }}>
              {t("shoppingMode.backToCategories")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {undo ? (
        <View
          style={{
            position: "absolute",
            left: spacing[4],
            right: spacing[4],
            bottom: spacing[6] + insets.bottom,
            backgroundColor: theme.text,
            borderRadius: radius.md,
            padding: spacing[4],
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ ...typography.label, color: theme.bg, flex: 1 }}>
            {t("shoppingMode.undoSnackbar", { name: undo.item.name })}
          </Text>
          <Pressable onPress={() => void restoreUndo(undo)}>
            <Text style={{ ...typography.label, color: shoppingDensity.purchasedColor }}>
              {t("shoppingMode.undo")}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
