import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { fetchHealth, hasApiUrl } from "@/lib/api/client";
import i18n from "@/lib/i18n";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const [healthMessage, setHealthMessage] = useState<string | null>(null);

  const toggleLanguage = () => {
    const next = i18n.language === "pl" ? "en" : "pl";
    void i18n.changeLanguage(next);
  };

  const onHealthCheck = async () => {
    if (!hasApiUrl()) {
      setHealthMessage(t("profile.apiUrlMissing"));
      return;
    }
    try {
      await fetchHealth();
      setHealthMessage(t("profile.healthOk"));
    } catch {
      setHealthMessage(t("profile.healthFail"));
    }
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.bg, padding: spacing[6] }}
    >
      <Text style={{ ...typography.title, color: theme.text }}>
        {t("profile.title")}
      </Text>
      <Text
        style={{
          ...typography.caption,
          color: theme.textMuted,
          marginTop: spacing[2],
        }}
      >
        {t("profile.demo")}
      </Text>

      <Text
        style={{
          ...typography.label,
          color: theme.text,
          marginTop: spacing[8],
        }}
      >
        {t("profile.language")}
      </Text>
      <Pressable
        onPress={toggleLanguage}
        style={{
          marginTop: spacing[3],
          backgroundColor: theme.primary,
          paddingVertical: spacing[3],
          paddingHorizontal: spacing[4],
          borderRadius: radius.md,
          alignItems: "center",
        }}
      >
        <Text style={{ ...typography.label, color: "#FFFFFF" }}>
          {i18n.language === "pl"
            ? t("profile.switchToEn")
            : t("profile.switchToPl")}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => void onHealthCheck()}
        style={{
          marginTop: spacing[4],
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          paddingVertical: spacing[3],
          paddingHorizontal: spacing[4],
          borderRadius: radius.md,
          alignItems: "center",
        }}
      >
        <Text style={{ ...typography.label, color: theme.text }}>
          {t("profile.healthCheck")}
        </Text>
      </Pressable>

      {healthMessage ? (
        <Text
          style={{
            ...typography.body,
            color: theme.textMuted,
            marginTop: spacing[4],
          }}
        >
          {healthMessage}
        </Text>
      ) : null}
    </View>
  );
}
