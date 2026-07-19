import { getShoppingCategoryIcon } from "@shared/shopping-categories";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import type { ShoppingItem } from "@/features/shopping-item/schemas";

import { CATEGORY_BADGE_COLORS } from "./category-badge-colors";

type Props = {
  item: ShoppingItem;
  showDivider?: boolean;
  /** Omit for read-only rows (e.g. History preview). */
  onMenuPress?: () => void;
};

export function ListItemRow({ item, showDivider = true, onMenuPress }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const badge = CATEGORY_BADGE_COLORS[item.category];
  const bought = item.status === "bought";

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[3],
          paddingVertical: spacing[3],
        }}
      >
        <Text style={{ fontSize: 22, opacity: bought ? 0.45 : 1 }}>
          {getShoppingCategoryIcon(item.category)}
        </Text>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={2}
            style={{
              ...typography.headline,
              color: bought ? theme.textMuted : theme.text,
              textDecorationLine: bought ? "line-through" : "none",
            }}
          >
            {item.name}
          </Text>
          {item.note ? (
            <Text
              numberOfLines={2}
              style={{
                ...typography.caption,
                color: theme.textMuted,
                marginTop: 2,
              }}
            >
              {item.note}
            </Text>
          ) : null}
        </View>

        {item.amount ? (
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              flexShrink: 0,
            }}
          >
            {item.amount}
          </Text>
        ) : null}

        <View
          style={{
            backgroundColor: badge.background,
            borderRadius: radius.full,
            paddingHorizontal: spacing[2] + 2,
            paddingVertical: spacing[1],
            flexShrink: 0,
          }}
        >
          <Text
            style={{
              ...typography.caption,
              fontWeight: "600",
              color: badge.text,
            }}
          >
            {t(`categories.${item.category}`)}
          </Text>
        </View>

        {onMenuPress ? (
          <Pressable
            onPress={onMenuPress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("list.itemMenu")}
            style={{
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
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
        ) : null}
      </View>

      {showDivider ? (
        <View style={{ height: 1, backgroundColor: theme.border }} />
      ) : null}
    </View>
  );
}
