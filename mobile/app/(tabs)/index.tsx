import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, spacing, typography } from "@/design-system/tokens";

export default function HomeScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.bg, padding: spacing[6] }}
    >
      <Text style={{ ...typography.display, color: theme.primary }}>
        {t("home.title")}
      </Text>
      <Text
        style={{
          ...typography.body,
          color: theme.textMuted,
          marginTop: spacing[2],
        }}
      >
        {t("home.subtitle")}
      </Text>
      <Text
        style={{
          ...typography.body,
          color: theme.text,
          marginTop: spacing[8],
        }}
      >
        {t("home.placeholder")}
      </Text>
    </View>
  );
}
