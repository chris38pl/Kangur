import {
  getShoppingCategoryIcon,
  isShoppingCategory,
  type ShoppingCategory,
} from "@shared/shopping-categories";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { shoppingDensity } from "@/design-system/shopping-density";
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { getCategoryBadgeColors } from "@/features/shopping-item/category-badge-colors";
import type { ShoppingItem } from "@/features/shopping-item/schemas";
import { useShoppingItems } from "@/features/shopping-item/useShoppingItems";
import { notifyFinishedForActiveSession } from "@/features/shopping-list/session/notify-finished";
import { useShoppingSession } from "@/features/shopping-list/session/useShoppingSession";
import { useShoppingList } from "@/features/shopping-list/useShoppingLists";
import { RemoteChangeToast, useListRealtime } from "@/lib/realtime";

import {
  getCategoryTripPosition,
  nextCategoryWithActive,
  sortItemsInCategory,
} from "./category-progress";
import { ShoppingFeedbackBanner } from "./shopping-feedback-banner";
import { SwipeableItemRow } from "./swipeable-item-row";

type UndoSnapshot = {
  item: ShoppingItem;
  previousStatus: ShoppingItem["status"];
  appliedStatus: "bought" | "unavailable";
  index: number;
};

type Props = {
  listId: string;
  category: string;
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

function DoneItemCard({
  item,
  onUndo,
}: {
  item: ShoppingItem;
  onUndo: () => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const badge = getCategoryBadgeColors(item.category);

  return (
    <Pressable
      onPress={onUndo}
      accessibilityRole="button"
      style={{
        backgroundColor: theme.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.border,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        marginBottom: spacing[3],
        ...shadows.soft,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[3],
          opacity: 0.45,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.lg,
            backgroundColor: badge.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 22 }}>
            {getShoppingCategoryIcon(item.category)}
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              ...typography.headline,
              color: theme.text,
              fontSize: 16,
              lineHeight: 22,
            }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.note ? (
            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {item.note}
            </Text>
          ) : null}
        </View>

        {item.amount ? (
          <Text
            style={{
              ...typography.label,
              color: theme.textMuted,
              flexShrink: 0,
            }}
            numberOfLines={1}
          >
            {item.amount}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function ShoppingCategoryScreen({
  listId,
  category: categoryParam,
}: Props) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const itemsQuery = useShoppingItems(listId);
  const listQuery = useShoppingList(listId);
  const session = useShoppingSession(listId);
  const [undo, setUndo] = useState<UndoSnapshot | null>(null);
  const [purchasedExpanded, setPurchasedExpanded] = useState(true);
  const [wasCategoryDone, setWasCategoryDone] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useListRealtime(listId, {
    workspaceId: listQuery.data?.workspaceId ?? null,
  });

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
  const doneItems = [...purchased, ...unavailable];
  const categoryDone = active.length === 0 && catItems.length > 0;

  // Auto-collapse once when the category completes; user can expand again.
  if (categoryDone !== wasCategoryDone) {
    setWasCategoryDone(categoryDone);
    if (categoryDone) {
      setPurchasedExpanded(false);
    }
  }

  const next = useMemo(
    () =>
      category && itemsQuery.data
        ? nextCategoryWithActive(itemsQuery.data, category)
        : null,
    [category, itemsQuery.data],
  );

  const tripPosition = useMemo(
    () =>
      category && itemsQuery.data
        ? getCategoryTripPosition(itemsQuery.data, category)
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
    showUndo({
      item,
      previousStatus: item.status,
      appliedStatus: status,
      index,
    });
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
      <View
        style={{
          flex: 1,
          padding: spacing[6],
          backgroundColor: theme.section,
        }}
      >
        <Text style={{ color: theme.danger }}>
          {t("shoppingMode.invalidCategory")}
        </Text>
      </View>
    );
  }

  if (itemsQuery.isPending) {
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

  const badge = getCategoryBadgeColors(category);
  const nextBadge = next ? getCategoryBadgeColors(next.category) : null;
  const bannerCategory = next?.category ?? category;
  const bannerBadge = nextBadge ?? badge;

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
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              minHeight: 48,
            }}
          >
            <Pressable
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace(`/list/${listId}/shop`);
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t("auth.back")}
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <BackIcon size={20} />
            </Pressable>

            <View
              style={{
                position: "absolute",
                left: 48,
                right: 48,
                alignItems: "center",
              }}
            >
              <Text
                numberOfLines={1}
                style={{ ...typography.headline, color: theme.text }}
              >
                {t(`categories.${category}`)}
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  marginTop: 2,
                }}
              >
                {t("shoppingMode.remainingShort", { count: active.length })}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            padding: spacing[6],
            paddingBottom: 100 + insets.bottom,
          }}
        >
        {categoryDone ? (
          <View
            style={{
              alignItems: "center",
              marginBottom: spacing[6],
              paddingTop: spacing[2],
            }}
          >
            <Image
              source={brandAssets.categoryComplete}
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
                marginTop: spacing[4],
                textAlign: "center",
              }}
            >
              {t("shoppingMode.categoryGreat")}
            </Text>
            <Text
              style={{
                ...typography.body,
                color: theme.textMuted,
                marginTop: spacing[1],
                textAlign: "center",
              }}
            >
              {t("shoppingMode.categoryFinishedBody")}
            </Text>
          </View>
        ) : null}

        {active.length > 0 ? (
          <View style={{ marginBottom: spacing[4] }}>
            <SectionTitle>{t("itemStatus.pending")}</SectionTitle>
            {active.map((item, index) => (
              <SwipeableItemRow
                key={item.id}
                item={item}
                index={index}
                onPurchase={(it, idx) => void applyStatus(it, idx, "bought")}
                onUnavailable={(it, idx) =>
                  void applyStatus(it, idx, "unavailable")
                }
              />
            ))}
          </View>
        ) : null}

        {doneItems.length > 0 ? (
          <View style={{ marginBottom: spacing[4] }}>
            <Pressable
              onPress={() => setPurchasedExpanded((v) => !v)}
              accessibilityRole="button"
              style={{
                marginBottom: purchasedExpanded ? spacing[3] : 0,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ ...typography.headline, color: theme.text }}>
                  {t("shoppingMode.purchased")}
                  {categoryDone ? ` (${doneItems.length})` : ""}
                </Text>
                <Text style={{ ...typography.label, color: theme.textMuted }}>
                  {purchasedExpanded ? "▾" : "▸"}
                </Text>
              </View>
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  marginTop: spacing[1],
                }}
              >
                {t("shoppingMode.purchasedRestoreHint")}
              </Text>
            </Pressable>
            {purchasedExpanded
              ? doneItems.map((item) => (
                  <DoneItemCard
                    key={item.id}
                    item={item}
                    onUndo={() =>
                      void restoreUndo({
                        item,
                        previousStatus: "pending",
                        appliedStatus:
                          item.status === "unavailable"
                            ? "unavailable"
                            : "bought",
                        index: 0,
                      })
                    }
                  />
                ))
              : null}
          </View>
        ) : null}

        {tripPosition ? (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: theme.border,
              padding: spacing[4],
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[3],
              marginTop: spacing[2],
              ...shadows.soft,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ ...typography.headline, color: theme.text }}>
                {tripPosition.current >= tripPosition.total
                  ? t("shoppingMode.categoryProgressTitleLast")
                  : t("shoppingMode.categoryProgressTitle", {
                      current: tripPosition.current,
                      total: tripPosition.total,
                    })}
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  marginTop: spacing[1],
                }}
              >
                {next
                  ? t("shoppingMode.categoryProgressHint")
                  : t("shoppingMode.categoryProgressHintLast")}
              </Text>
            </View>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.lg,
                backgroundColor: bannerBadge.background,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 34 }}>
                {getShoppingCategoryIcon(bannerCategory)}
              </Text>
            </View>
          </View>
        ) : null}

        {categoryDone ? (
          <View
            style={{
              marginTop: spacing[6],
              gap: spacing[3],
            }}
          >
            <Pressable
              onPress={() => {
                if (next) {
                  router.replace(`/list/${listId}/shop/${next.category}`);
                } else {
                  const unavailable = (itemsQuery.data ?? []).filter(
                    (i) => i.status === "unavailable",
                  ).length;
                  void notifyFinishedForActiveSession(
                    listId,
                    getToken,
                    unavailable,
                  );
                  router.push(`/list/${listId}/shop/finish`);
                }
              }}
              style={{
                backgroundColor: theme.primary,
                borderRadius: radius.full,
                paddingVertical: spacing[4],
                alignItems: "center",
                minHeight: shoppingDensity.primaryCtaMinHeight,
                justifyContent: "center",
              }}
            >
              <Text style={{ ...typography.label, color: theme.onPrimary }}>
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
                router.replace(`/list/${listId}/shop`);
              }}
              style={{ paddingVertical: spacing[2], alignItems: "center" }}
            >
              <Text style={{ ...typography.label, color: theme.primary }}>
                {t("shoppingMode.backToCategories")}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
      </View>

      <ShoppingFeedbackBanner
        listId={listId}
        layout="overlay"
        undo={
          undo
            ? { name: undo.item.name, kind: undo.appliedStatus }
            : null
        }
        onUndo={() => {
          if (undo) void restoreUndo(undo);
        }}
      />

    </View>
  );
}
