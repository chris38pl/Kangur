import {
  getShoppingCategoryIcon,
  type ShoppingCategory as SharedShoppingCategory,
} from "@shared/shopping-categories";
import { memo, useCallback, useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, spacing, typography } from "@/design-system/tokens";

import { CategoryReorderList } from "./category-reorder-list";
import type { CategoryReorderRenderArgs } from "./category-reorder-types";
import { CategoryReorderScrollIsland } from "./category-reorder-scroll-island";
import {
  CategoryOrderEditRow,
  CategoryOrderHint,
} from "./category-order-ui";
import { useNestableOuterScrollLock } from "./nestable-outer-scroll-lock-context";

type Props = {
  categories: SharedShoppingCategory[];
  categoryItemCounts: ReadonlyMap<SharedShoppingCategory, number>;
  readOnly: boolean;
  onReorder: (data: SharedShoppingCategory[]) => void;
  /** When true, section starts collapsed (archived list). */
  startCollapsed?: boolean;
  /** Called when native category drag starts/ends (cancel competing scroll). */
  onDragActiveChange?: (dragging: boolean) => void;
};

export const ListEditCategoryOrderSection = memo(function ListEditCategoryOrderSection({
  categories,
  categoryItemCounts,
  readOnly,
  onReorder,
  startCollapsed = false,
  onDragActiveChange,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const [open, setOpen] = useState(!startCollapsed);
  const [isDragging, setIsDragging] = useState(false);
  const [displayCategories, setDisplayCategories] = useState(categories);
  const outerScrollLock = useNestableOuterScrollLock();

  useEffect(() => {
    if (startCollapsed) setOpen(false);
  }, [startCollapsed]);

  useEffect(() => {
    if (!isDragging) {
      setDisplayCategories(categories);
    }
  }, [categories, isDragging]);

  const handleReorder = useCallback(
    (next: SharedShoppingCategory[]) => {
      setDisplayCategories(next);
      onReorder(next);
    },
    [onReorder],
  );

  const renderItem = useCallback(
    ({
      item,
      drag,
      isActive,
      moveUp,
      moveDown,
    }: CategoryReorderRenderArgs<SharedShoppingCategory>) => (
      <CategoryOrderEditRow
        icon={getShoppingCategoryIcon(item)}
        label={t(`categories.${item}`)}
        subtitle={t("list.itemCount", {
          count: categoryItemCounts.get(item) ?? 0,
        })}
        onDrag={drag}
        readOnly={readOnly}
        isActive={isActive}
        moveUp={readOnly ? undefined : moveUp}
        moveDown={readOnly ? undefined : moveDown}
      />
    ),
    [categoryItemCounts, readOnly, t],
  );

  if (categories.length <= 1) return null;

  return (
    <View style={{ marginTop: spacing[8] }}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 44,
        }}
      >
        <Text
          style={{
            ...typography.headline,
            color: open ? theme.text : theme.textMuted,
            flex: 1,
            paddingRight: spacing[3],
          }}
        >
          {t("list.categoryOrderTitle")}
        </Text>
        <Text
          style={{
            color: open ? theme.text : theme.textMuted,
            fontSize: 22,
            lineHeight: 26,
            fontWeight: "600",
          }}
        >
          {open ? "▾" : "▸"}
        </Text>
      </Pressable>
      {open ? (
        <View>
          <CategoryOrderHint>
            {t(
              Platform.OS === "web"
                ? "list.categoryOrderHintWeb"
                : "list.categoryOrderHint",
            )}
          </CategoryOrderHint>
          <CategoryReorderScrollIsland>
            <CategoryReorderList
              data={displayCategories}
              keyExtractor={(item) => item}
              onDragBegin={() => {
                outerScrollLock?.lockOuterScroll();
                setIsDragging(true);
                onDragActiveChange?.(true);
              }}
              onDragEnd={() => {
                outerScrollLock?.unlockOuterScroll();
                setIsDragging(false);
                onDragActiveChange?.(false);
              }}
              onReorder={handleReorder}
              renderItem={renderItem}
            />
          </CategoryReorderScrollIsland>
        </View>
      ) : null}
    </View>
  );
});
