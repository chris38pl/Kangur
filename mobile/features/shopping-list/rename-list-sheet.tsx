import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

type Props = {
  visible: boolean;
  initialName: string;
  busy?: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
};

export function RenameListSheet({
  visible,
  initialName,
  busy = false,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight(visible);
  const [name, setName] = useState(initialName);

  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

  const trimmed = name.trim();
  const canSave =
    trimmed.length >= 1 &&
    trimmed.length <= 64 &&
    trimmed !== initialName.trim() &&
    !busy;

  const bottomPad =
    keyboardHeight > 0
      ? spacing[4]
      : spacing[6] + Math.max(insets.bottom, spacing[4]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("list.renameCancel")}
          onPress={close}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        />

        <View
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingTop: spacing[6],
            paddingHorizontal: spacing[6],
            paddingBottom: bottomPad,
            marginBottom: keyboardHeight,
          }}
        >
          <Text style={{ ...typography.title, color: theme.text }}>
            {t("list.renameTitle")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textMuted,
              marginTop: spacing[2],
            }}
          >
            {t("list.renameSubtitle")}
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={64}
            placeholder={t("list.renamePlaceholder")}
            placeholderTextColor={theme.textMuted}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (canSave) onSave(trimmed);
            }}
            style={{
              marginTop: spacing[5],
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.surface,
              borderRadius: radius.lg,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[4],
              color: theme.text,
              fontSize: typography.body.fontSize,
            }}
          />

          <Pressable
            disabled={!canSave}
            onPress={() => onSave(trimmed)}
            style={{
              marginTop: spacing[5],
              backgroundColor: theme.primary,
              borderRadius: radius.full,
              paddingVertical: spacing[4],
              alignItems: "center",
              opacity: canSave ? 1 : 0.5,
            }}
          >
            {busy ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <Text style={{ ...typography.label, color: theme.onPrimary }}>
                {t("list.renameSave")}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={close}
            disabled={busy}
            style={{
              marginTop: spacing[3],
              paddingVertical: spacing[3],
              alignItems: "center",
            }}
          >
            <Text style={{ ...typography.body, color: theme.textMuted }}>
              {t("list.renameCancel")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
