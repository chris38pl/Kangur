import { Image, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  visible: boolean;
  email: string;
  resent?: boolean;
  onClose: () => void;
};

/**
 * Success feedback after sending / resending a workspace invite.
 */
export function InviteSentSheet({
  visible,
  email,
  resent = false,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.return")}
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(31, 43, 69, 0.4)",
          }}
        />

        <View
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            paddingHorizontal: spacing[6],
            paddingTop: spacing[5],
            paddingBottom: Math.max(insets.bottom, spacing[4]) + spacing[4],
            ...shadows.soft,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Image
              source={brandAssets.inviteWelcome}
              style={{
                width: 180,
                height: 160,
                resizeMode: "contain",
              }}
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
              {t("workspace.inviteSentTitle")}
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
              {resent
                ? t("workspace.inviteResentBody", { email })
                : t("workspace.inviteSentBody", { email })}
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t("common.return")}
            style={{
              marginTop: spacing[6],
              backgroundColor: theme.primary,
              borderRadius: radius.full,
              paddingVertical: spacing[4],
              alignItems: "center",
            }}
          >
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("common.return")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
