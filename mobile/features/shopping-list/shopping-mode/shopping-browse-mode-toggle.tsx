import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius } from "@/design-system/tokens";

import {
  BrowseModeAislesIcon,
  BrowseModeListIcon,
} from "./shopping-browse-mode-icons";
import type { ShoppingBrowseMode } from "./shopping-browse-mode-storage";

type Props = {
  mode: ShoppingBrowseMode;
  onChange: (mode: ShoppingBrowseMode) => void;
};

export function ShoppingBrowseModeToggle({ mode, onChange }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.border,
        borderRadius: radius.md,
        padding: 2,
        gap: 2,
      }}
    >
      <Pressable
        onPress={() => onChange("aisles")}
        accessibilityRole="button"
        accessibilityState={{ selected: mode === "aisles" }}
        accessibilityLabel={t("shoppingMode.browseModeAisles")}
        hitSlop={4}
        style={{
          width: 32,
          height: 28,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.sm,
          backgroundColor: mode === "aisles" ? theme.bg : "transparent",
        }}
      >
        <BrowseModeAislesIcon
          color={mode === "aisles" ? theme.primary : theme.textMuted}
          size={16}
        />
      </Pressable>
      <Pressable
        onPress={() => onChange("list")}
        accessibilityRole="button"
        accessibilityState={{ selected: mode === "list" }}
        accessibilityLabel={t("shoppingMode.browseModeList")}
        hitSlop={4}
        style={{
          width: 32,
          height: 28,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.sm,
          backgroundColor: mode === "list" ? theme.bg : "transparent",
        }}
      >
        <BrowseModeListIcon
          color={mode === "list" ? theme.primary : theme.textMuted}
          size={16}
        />
      </Pressable>
    </View>
  );
}
