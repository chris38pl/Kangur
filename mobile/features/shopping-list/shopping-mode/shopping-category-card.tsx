import {
  getShoppingCategoryIcon,
  type ShoppingCategory,
} from "@shared/shopping-categories";
import { Platform, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { shoppingDensity } from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { PressableScale } from "@/lib/motion";
import { getCategoryBadgeColors } from "@/features/shopping-item/category-badge-colors";
import {
  CategoryDragHandle,
  CategoryReorderWebControls,
} from "@/features/shopping-list/category-order-ui";

import type { CategoryProgress } from "./category-progress";
import { CategoryProgressBar } from "./category-progress-bar";

type Props = {
  cat: CategoryProgress;
  variant: "active" | "completed";
  onPress: (category: ShoppingCategory) => void;
  /** When set, shows a drag handle (Shopping Mode reorder). */
  onDrag?: () => void;
  isDragging?: boolean;
  moveUp?: () => void;
  moveDown?: () => void;
};

export function ShoppingCategoryCard({
  cat,
  variant,
  onPress,
  onDrag,
  isDragging,
  moveUp,
  moveDown,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const badge = getCategoryBadgeColors(cat.category);
  const webControls = Platform.OS === "web" || Boolean(moveUp || moveDown);

  const subtitle =
    variant === "completed"
      ? t("shoppingMode.boughtOfTotal", {
          bought: cat.purchasedCount,
          total: cat.totalTracked,
        })
      : t("shoppingMode.leftCount", { count: cat.activeCount });

  // Outer View (not Pressable): reorder controls must be siblings of the
  // open-aisle control — nested <button> breaks react-native-web hydration.
  return (
    <View
      style={{
        marginBottom: spacing[3],
        padding: spacing[4],
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: isDragging ? theme.section : theme.surface,
        minHeight: shoppingDensity.categoryRowMinHeight,
        opacity: variant === "completed" ? 0.92 : 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <PressableScale
        onPress={() => onPress(cat.category)}
        accessibilityRole="button"
        accessibilityLabel={t(`categories.${cat.category}`)}
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          minWidth: 0,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.lg,
            backgroundColor: badge.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 26 }}>
            {getShoppingCategoryIcon(cat.category)}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{ ...typography.headline, color: theme.text }}
          >
            {t(`categories.${cat.category}`)}
          </Text>
          <Text style={{ ...typography.caption, color: theme.textMuted }}>
            {subtitle}
          </Text>
          <CategoryProgressBar progress={cat.progress} />
        </View>
      </PressableScale>
      {webControls ? (
        <CategoryReorderWebControls moveUp={moveUp} moveDown={moveDown} />
      ) : onDrag ? (
        <CategoryDragHandle onLongPress={onDrag} />
      ) : null}
    </View>
  );
}
