import { Pressable, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { brand, colors, radius, spacing } from "@/design-system/tokens";

export type ItemsSortMode = "category" | "date";

type Props = {
  value: ItemsSortMode;
  onChange: (mode: ItemsSortMode) => void;
};

/** Three aisle bars - sort / group by category. */
export function CategorySortIcon({ color, size = 18 }: { color: string; size?: number }) {
  const barHeight = Math.max(2, Math.round(size * 0.14));
  const gap = Math.max(2, Math.round(size * 0.12));
  const bar = (widthPct: number): ViewStyle => ({
    width: size * widthPct,
    height: barHeight,
    borderRadius: barHeight,
    backgroundColor: color,
  });
  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        gap,
      }}
    >
      <View style={bar(1)} />
      <View style={bar(0.72)} />
      <View style={bar(0.88)} />
    </View>
  );
}

/** Clock face - sort by created / updated time. */
export function DateSortIcon({ color, size = 18 }: { color: string; size?: number }) {
  const stroke = Math.max(1.5, size * 0.1);
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
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: color,
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: size * 0.22,
        }}
      >
        <View
          style={{
            width: stroke,
            height: size * 0.28,
            borderRadius: stroke,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: size * 0.42,
            left: size * 0.48,
            width: size * 0.28,
            height: stroke,
            borderRadius: stroke,
            backgroundColor: color,
            transform: [{ rotate: "25deg" }],
          }}
        />
      </View>
    </View>
  );
}

export function ItemsSortToggle({ value, onChange }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const btn = (mode: ItemsSortMode, selected: boolean) => (
    <Pressable
      key={mode}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={
        mode === "category"
          ? t("list.sortByCategoryA11y")
          : t("list.sortByDateA11y")
      }
      onPress={() => onChange(mode)}
      hitSlop={6}
      style={{
        width: 36,
        height: 36,
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: selected ? brand.accent : "transparent",
        marginLeft: spacing[1],
      }}
    >
      {mode === "category" ? (
        <CategorySortIcon
          color={selected ? brand.primary : theme.textMuted}
          size={18}
        />
      ) : (
        <DateSortIcon
          color={selected ? brand.primary : theme.textMuted}
          size={18}
        />
      )}
    </Pressable>
  );

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {btn("category", value === "category")}
      {btn("date", value === "date")}
    </View>
  );
}
