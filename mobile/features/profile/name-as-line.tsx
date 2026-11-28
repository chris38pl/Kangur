import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, spacing, typography } from "@/design-system/tokens";

/** "Zaprosisz jako Kasia · Zmień": one quiet line instead of a field for someone with a name. */
export function NameAsLine({ text, onChange }: { text: string; onChange: () => void }) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
      <Text style={{ ...typography.caption, color: theme.textMuted }}>{text}</Text>
      <Text style={{ ...typography.caption, color: theme.textMuted }}>{" · "}</Text>
      <Pressable
        onPress={onChange}
        hitSlop={8}
        accessibilityRole="button"
        style={{ paddingVertical: spacing[1] }}
      >
        <Text style={{ ...typography.caption, color: theme.primary, fontWeight: "700" }}>
          {t("name.change")}
        </Text>
      </Pressable>
    </View>
  );
}
