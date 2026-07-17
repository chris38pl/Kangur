import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { shoppingDensity } from "@/design-system/shopping-density";
import { colors, spacing, typography } from "@/design-system/tokens";

type Props = {
  title: string;
  remaining: number;
};

export function ShoppingHomeHeader({ title, remaining }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View style={{ marginBottom: spacing[4] }}>
      <Text style={{ ...typography.title, color: theme.text }}>{title}</Text>
      <Text
        style={{
          ...typography.body,
          color: theme.textMuted,
          marginTop: spacing[1],
        }}
      >
        {t("shoppingMode.remainingTotal", { count: remaining })}
      </Text>
    </View>
  );
}

/** Reserved spacing for future sticky search — owns layout even when empty. */
export function SearchSlot() {
  return (
    <View
      style={{
        height: shoppingDensity.searchSlotHeight,
        marginBottom: spacing[3],
      }}
    />
  );
}
