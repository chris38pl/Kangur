import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
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
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Branded type-to-confirm sheet for permanent account deletion.
 * Confirm phrase: USUŃ (pl) / DELETE (en).
 */
export function DeleteAccountSheet({
  visible,
  busy = false,
  onCancel,
  onConfirm,
}: Props) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const [typed, setTyped] = useState("");

  const confirmPhrase = t("privacy.delete.confirmPhrase");
  const canConfirm =
    typed.trim().toLocaleUpperCase(i18n.language) ===
    confirmPhrase.toLocaleUpperCase(i18n.language);

  useEffect(() => {
    if (!visible) setTyped("");
  }, [visible]);

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
          accessibilityLabel={t("privacy.delete.back")}
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
            accessibilityLabel={t("privacy.delete.back")}
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

          <View style={{ alignItems: "center", marginTop: spacing[1] }}>
            <Image
              source={brandAssets.deleteList}
              style={{ width: 200, height: 200, resizeMode: "contain" }}
              accessibilityLabel=""
            />
          </View>

          <Text
            style={{
              ...typography.title,
              color: theme.text,
              textAlign: "center",
              marginTop: spacing[4],
            }}
          >
            {t("privacy.delete.title")}
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
            {t("privacy.delete.body")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.danger,
              textAlign: "center",
              marginTop: spacing[2],
              fontWeight: "600",
            }}
          >
            {t("privacy.delete.irreversible")}
          </Text>

          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              marginTop: spacing[5],
              marginBottom: spacing[2],
            }}
          >
            {t("privacy.delete.typePrompt", { phrase: confirmPhrase })}
          </Text>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            editable={!busy}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={confirmPhrase}
            placeholderTextColor={theme.textMuted}
            style={{
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.bg,
              borderRadius: radius.md,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
              ...typography.body,
              color: theme.text,
              textAlign: "center",
              fontWeight: "700",
              letterSpacing: 1,
            }}
          />

          <Pressable
            disabled={busy || !canConfirm}
            onPress={onConfirm}
            style={{
              marginTop: spacing[5],
              minHeight: 56,
              borderRadius: radius.full,
              backgroundColor: theme.danger,
              alignItems: "center",
              justifyContent: "center",
              opacity: busy || !canConfirm ? 0.45 : 1,
            }}
          >
            {busy ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <Text style={{ ...typography.label, color: theme.onPrimary }}>
                {t("privacy.delete.confirm")}
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
              {t("privacy.delete.back")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
