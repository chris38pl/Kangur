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

function CheckMark({ color, size = 7 }: { color: string; size?: number }) {
  return (
    <View
      style={{
        width: size * 0.7,
        height: size * 0.4,
        borderLeftWidth: 1.5,
        borderBottomWidth: 1.5,
        borderColor: color,
        transform: [{ rotate: "-45deg" }, { translateY: -0.5 }],
      }}
    />
  );
}

function CrossMark({ color, size = 6 }: { color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: size,
          height: 1.5,
          borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size,
          height: 1.5,
          borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}

/** Status badge overlaid on the category glyph (bought / unavailable only). */
function CategoryStatusBadge({
  status,
}: {
  status: "bought" | "unavailable";
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const size = 14;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={
        status === "bought"
          ? t("itemStatus.bought")
          : t("shoppingMode.unavailable")
      }
      style={{
        position: "absolute",
        right: -3,
        bottom: -3,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: status === "bought" ? theme.success : theme.danger,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: theme.bg,
      }}
    >
      {status === "bought" ? (
        <CheckMark color="#fff" size={7} />
      ) : (
        <CrossMark color="#fff" size={6} />
      )}
    </View>
  );
}

export function ListItemRow({ item, showDivider = true, onMenuPress }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const badge = CATEGORY_BADGE_COLORS[item.category];
  const bought = item.status === "bought";
  const unavailable = item.status === "unavailable";
  const dimmed = bought || unavailable;

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
        <View
          style={{
            width: 28,
            height: 28,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 22, opacity: dimmed ? 0.45 : 1 }}>
            {getShoppingCategoryIcon(item.category)}
          </Text>
          {bought || unavailable ? (
            <CategoryStatusBadge
              status={bought ? "bought" : "unavailable"}
            />
          ) : null}
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={2}
            style={{
              ...typography.headline,
              color: dimmed ? theme.textMuted : theme.text,
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
            opacity: dimmed ? 0.7 : 1,
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
