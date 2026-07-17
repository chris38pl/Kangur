import {
  WORKSPACE_ICONS,
  isWorkspaceIconId,
  type WorkspaceIconId,
} from "@shared/workspace-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

import type { Workspace } from "./schemas";

type Props = {
  visible: boolean;
  workspace: Workspace | null;
  busy?: boolean;
  onClose: () => void;
  onSave: (input: { name: string; icon: WorkspaceIconId }) => void;
};

export function EditWorkspaceSheet({
  visible,
  workspace,
  busy = false,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight(visible);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState<WorkspaceIconId>("home");

  useEffect(() => {
    if (!visible || !workspace) return;
    setName(workspace.name);
    setIcon(isWorkspaceIconId(workspace.icon) ? workspace.icon : "home");
  }, [visible, workspace]);

  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

  const trimmed = name.trim();
  const canSave =
    Boolean(workspace) &&
    trimmed.length >= 1 &&
    trimmed.length <= 64 &&
    !busy &&
    (trimmed !== (workspace?.name ?? "").trim() || icon !== workspace?.icon);

  const submit = () => {
    if (!canSave) return;
    onSave({ name: trimmed, icon });
  };

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
          accessibilityLabel={t("workspace.cancel")}
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
            maxHeight: "92%",
            paddingTop: spacing[6],
            paddingHorizontal: spacing[6],
            paddingBottom: bottomPad,
            marginBottom: keyboardHeight,
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={{ ...typography.title, color: theme.text }}>
              {t("workspace.editTitle")}
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("workspace.namePlaceholder")}
              placeholderTextColor={theme.textMuted}
              style={{
                marginTop: spacing[4],
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                borderRadius: radius.md,
                padding: spacing[4],
                color: theme.text,
              }}
            />

            <Text
              style={{
                ...typography.label,
                color: theme.textMuted,
                marginTop: spacing[4],
              }}
            >
              {t("workspace.pickIcon")}
            </Text>
            <View
              style={{
                marginTop: spacing[3],
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing[2],
              }}
            >
              {WORKSPACE_ICONS.map((item) => {
                const selected = item.id === icon;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setIcon(item.id)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: radius.md,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: selected ? theme.primary : theme.border,
                      backgroundColor: theme.surface,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              disabled={!canSave}
              onPress={submit}
              style={{
                marginTop: spacing[6],
                backgroundColor: theme.primary,
                borderRadius: radius.md,
                paddingVertical: spacing[4],
                alignItems: "center",
                opacity: canSave ? 1 : 0.6,
              }}
            >
              {busy ? (
                <ActivityIndicator color={theme.onPrimary} />
              ) : (
                <Text style={{ ...typography.label, color: theme.onPrimary }}>
                  {t("workspace.editSave")}
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={close}
              style={{
                marginTop: spacing[3],
                alignItems: "center",
                minHeight: 44,
                justifyContent: "center",
              }}
            >
              <Text style={{ ...typography.label, color: theme.textMuted }}>
                {t("workspace.cancel")}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
