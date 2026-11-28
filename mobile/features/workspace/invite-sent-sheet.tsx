import { Image, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { colors, spacing, typography } from "@/design-system/tokens";

type Props = {
  email: string;
  resent?: boolean;
  /** `emailDelivered` from the server: false when the e-mail did not go out. */
  delivered?: boolean;
};

/**
 * Feedback after sending / resending an invitation by e-mail, inside the invite sheet. The
 * invitation is saved either way, but "sent" is said only when the e-mail really went out.
 */
export function InviteSentBody({ email, resent = false, delivered = true }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View style={{ alignItems: "center" }}>
      <Image
        source={delivered ? brandAssets.inviteWelcome : brandAssets.error}
        style={{ width: 180, height: 160, resizeMode: "contain" }}
        accessibilityLabel=""
      />
      <Text
        style={{
          ...typography.title,
          color: theme.text,
          textAlign: "center",
          marginTop: spacing[4],
        }}
      >
        {delivered ? t("workspace.inviteSentTitle") : t("workspace.inviteNotSentTitle")}
      </Text>
      <Text
        style={{
          ...typography.body,
          color: theme.textBody,
          textAlign: "center",
          marginTop: spacing[2],
          paddingHorizontal: spacing[2],
        }}
      >
        {!delivered
          ? t("workspace.inviteNotSentBody", { email })
          : resent
            ? t("workspace.inviteResentBody", { email })
            : t("workspace.inviteSentBody", { email })}
      </Text>
    </View>
  );
}
