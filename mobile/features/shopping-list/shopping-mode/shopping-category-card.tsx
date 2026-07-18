import {
  getShoppingCategoryIcon,
  type ShoppingCategory,
} from "@shared/shopping-categories";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { shoppingDensity } from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { getCategoryBadgeColors } from "@/features/shopping-item/category-badge-colors";

import type { CategoryProgress } from "./category-progress";
import { CategoryProgressBar } from "./category-progress-bar";

type Props = {
  cat: CategoryProgress;
  variant: "active" | "completed";
  onPress: (category: ShoppingCategory) => void;
};

export function ShoppingCategoryCard({ cat, variant, onPress }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const badge = getCategoryBadgeColors(cat.category);

  const subtitle =
    variant === "completed"
      ? t("shoppingMode.boughtOfTotal", {
          bought: cat.purchasedCount,
          total: cat.totalTracked,
        })
      : t("shoppingMode.leftCount", { count: cat.activeCount });

  return (
    <Pressable
      onPress={() => onPress(cat.category)}
      accessibilityRole="button"
      accessibilityLabel={t(`categories.${cat.category}`)}
      style={{
        marginBottom: spacing[3],
        padding: spacing[4],
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        minHeight: shoppingDensity.categoryRowMinHeight,
        opacity: variant === "completed" ? 0.92 : 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
      </View>
    </Pressable>
  );
}
