import { Text } from "react-native";
import { useTranslation } from "react-i18next";

import { KangurMascot } from "@/components/KangurMascot";
import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { colors, spacing, typography } from "@/design-system/tokens";

export default function HistoryScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Screen
      edges={["top"]}
      style={{
        backgroundColor: theme.section,
        padding: spacing[6],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <KangurMascot variant="icon" width={100} height={100} />
      <Text
        style={{
          ...typography.title,
          color: theme.text,
          marginTop: spacing[6],
          textAlign: "center",
        }}
      >
        {t("history.title")}
      </Text>
      <Text
        style={{
          ...typography.body,
          color: theme.textBody,
          marginTop: spacing[2],
          textAlign: "center",
        }}
      >
        {t("history.placeholder")}
      </Text>
    </Screen>
  );
}
