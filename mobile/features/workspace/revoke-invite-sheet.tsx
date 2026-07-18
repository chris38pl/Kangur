import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
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
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Confirm sheet when revoking a pending workspace invitation.
 */
export function RevokeInviteSheet({
  visible,
  email,
  busy = false,
  onCancel,
  onConfirm,
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
      onRequestClose={busy ? undefined : onCancel}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("workspace.cancel")}
          onPress={busy ? undefined : onCancel}
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
          <Pressable
            onPress={onCancel}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t("workspace.cancel")}
            hitSlop={12}
            style={{
              alignSelf: "flex-end",
              width: 36,
              height: 36,
              borderRadius: radius.full,
              backgroundColor: theme.section,
              alignItems: "center",
              justifyContent: "center",
              opacity: busy ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                lineHeight: 20,
                color: theme.textMuted,
                fontWeight: "600",
              }}
            >
              ×
            </Text>
          </Pressable>

          <Text
            style={{
              ...typography.title,
              color: theme.text,
              textAlign: "center",
              marginTop: spacing[2],
            }}
          >
            {t("workspace.revokeInviteTitle")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              textAlign: "center",
              marginTop: spacing[3],
              paddingHorizontal: spacing[2],
            }}
          >
            {t("workspace.revokeInviteBody", { email })}
          </Text>

          <Pressable
            disabled={busy}
            onPress={onConfirm}
            style={{
              marginTop: spacing[6],
              minHeight: 56,
              borderRadius: radius.full,
              backgroundColor: theme.danger,
              alignItems: "center",
              justifyContent: "center",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <Text style={{ ...typography.label, color: theme.onPrimary }}>
                {t("workspace.revokeInviteConfirm")}
              </Text>
            )}
          </Pressable>

          <Pressable
            disabled={busy}
            onPress={onCancel}
            style={{
              marginTop: spacing[3],
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ ...typography.label, color: theme.textMuted }}>
              {t("workspace.cancel")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
