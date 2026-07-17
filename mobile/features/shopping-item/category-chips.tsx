import {
  getShoppingCategoryIcon,
  SHOPPING_CATEGORIES,
  type ShoppingCategory,
} from "@shared/shopping-categories";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

/** Picker order: “other” first, then the rest of the store flow. */
const CATEGORY_PICKER_ORDER: readonly ShoppingCategory[] = [
  "other",
  ...SHOPPING_CATEGORIES.filter((cat) => cat !== "other"),
];

type Props = {
  value: ShoppingCategory;
  onChange: (category: ShoppingCategory) => void;
  /** Show “Kategoria” label above the row. */
  showLabel?: boolean;
};

export function CategoryChips({ value, onChange, showLabel = true }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View>
      {showLabel ? (
        <Text
          style={{
            ...typography.headline,
            color: theme.text,
            marginBottom: spacing[3],
          }}
        >
          {t("list.categoryLabel")}
        </Text>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: spacing[2], paddingRight: spacing[2] }}
      >
        {CATEGORY_PICKER_ORDER.map((cat) => {
          const selected = cat === value;
          return (
            <Pressable
              key={cat}
              onPress={() => onChange(cat)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing[2],
                paddingVertical: spacing[2],
                paddingHorizontal: spacing[3],
                borderRadius: radius.full,
                backgroundColor: selected
                  ? `${theme.primary}14`
                  : theme.section,
                borderWidth: selected ? 1.5 : 1,
                borderColor: selected ? theme.primary : "transparent",
              }}
            >
              <Text style={{ fontSize: 16 }}>{getShoppingCategoryIcon(cat)}</Text>
              <Text
                style={{
                  ...typography.caption,
                  fontWeight: selected ? "600" : "500",
                  color: selected ? theme.primary : theme.text,
                }}
              >
                {t(`categories.${cat}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
