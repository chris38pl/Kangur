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

function CheckMark({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <View
      style={{
        width: size * 0.7,
        height: size * 0.4,
        borderLeftWidth: 2,
        borderBottomWidth: 2,
        borderColor: color,
        transform: [{ rotate: "-45deg" }, { translateY: -1 }],
      }}
    />
  );
}

function CrossMark({ color, size = 8 }: { color: string; size?: number }) {
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
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}

function PendingCartMark({ color, size = 12 }: { color: string; size?: number }) {
  const stroke = Math.max(1.4, size * 0.12);
  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      <View
        style={{
          width: size * 0.62,
          height: size * 0.42,
          borderWidth: stroke,
          borderColor: color,
          borderRadius: 2,
          marginTop: size * 0.22,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: size * 0.08,
          left: size * 0.12,
          width: size * 0.28,
          height: size * 0.22,
          borderLeftWidth: stroke,
          borderTopWidth: stroke,
          borderColor: color,
          borderTopLeftRadius: 3,
          transform: [{ rotate: "-18deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: size * 0.22,
          width: size * 0.14,
          height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          right: size * 0.16,
          width: size * 0.14,
          height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/** Small status glyph for edit-mode rows: bought / unavailable / pending. */
function ItemStatusGlyph({
  status,
}: {
  status: "bought" | "unavailable" | "pending";
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const size = 22;

  if (status === "pending") {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={t("itemStatus.pending")}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.section,
          borderWidth: 1,
          borderColor: theme.border,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <PendingCartMark color={theme.textMuted} size={12} />
      </View>
    );
  }

  const background = status === "bought" ? theme.success : theme.danger;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={
        status === "bought"
          ? t("itemStatus.bought")
          : t("shoppingMode.unavailable")
      }
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {status === "bought" ? (
        <CheckMark color="#fff" size={10} />
      ) : (
        <CrossMark color="#fff" size={8} />
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
        <Text style={{ fontSize: 22, opacity: dimmed ? 0.45 : 1 }}>
          {getShoppingCategoryIcon(item.category)}
        </Text>

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

        <ItemStatusGlyph
          status={
            bought ? "bought" : unavailable ? "unavailable" : "pending"
          }
        />

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
