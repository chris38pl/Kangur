import { Image, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/design-system/tokens";

type Props = {
  busy?: boolean;
  onInvite: () => void;
  onDismiss: () => void;
};

/**
 * Shown once per workspace on the shopping summary while the owner shops alone:
 * a shared list is the reason a second person joins.
 */
export function InviteHouseholdCard({ busy = false, onInvite, onDismiss }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        marginTop: spacing[4],
        backgroundColor: theme.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.border,
        padding: spacing[4],
        ...shadows.soft,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[3] }}>
        <Image
          source={brandAssets.inviteWelcome}
          style={{ width: 72, height: 72, resizeMode: "contain" }}
          accessibilityLabel=""
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...typography.headline, color: theme.text }}>
            {t("invitePrompt.title")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              marginTop: spacing[1],
            }}
          >
            {t("invitePrompt.body")}
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[3],
          marginTop: spacing[4],
        }}
      >
        <Pressable
          onPress={onInvite}
          disabled={busy}
          accessibilityRole="button"
          style={{
            flex: 1,
            backgroundColor: theme.primary,
            borderRadius: radius.full,
            paddingVertical: spacing[3],
            alignItems: "center",
            opacity: busy ? 0.7 : 1,
          }}
        >
          <Text style={{ ...typography.label, color: theme.onPrimary }}>
            {t("invitePrompt.cta")}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          disabled={busy}
          accessibilityRole="button"
          style={{ paddingVertical: spacing[3], paddingHorizontal: spacing[2] }}
        >
          <Text style={{ ...typography.label, color: theme.primary }}>
            {t("invitePrompt.later")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
