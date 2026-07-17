import { ActivityIndicator, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, spacing, typography } from "@/design-system/tokens";

import { useAiCredits } from "./useAiCredits";

type Props = {
  workspaceId: string;
};

export function AiCreditsBadge({ workspaceId }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const query = useAiCredits(workspaceId);

  if (query.isPending) {
    return (
      <View style={{ marginTop: spacing[2], flexDirection: "row", gap: 8 }}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={{ ...typography.caption, color: theme.textMuted }}>
          {t("billing.aiCredits")}
        </Text>
      </View>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Text
        style={{
          ...typography.caption,
          color: theme.textMuted,
          marginTop: spacing[2],
        }}
      >
        {t("billing.aiCreditsUnavailable")}
      </Text>
    );
  }

  const { unlimited, remaining, limit, used } = query.data;
  const label = unlimited
    ? t("billing.aiCreditsUnlimited")
    : t("billing.aiCreditsBalance", {
        remaining: remaining ?? 0,
        limit: limit ?? 0,
        used,
      });

  return (
    <Text
      style={{
        ...typography.caption,
        color: theme.textMuted,
        marginTop: spacing[2],
      }}
    >
      {t("billing.aiCredits")}: {label}
    </Text>
  );
}
