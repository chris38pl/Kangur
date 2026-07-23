import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { FallbackSymbol } from "@/components/FallbackSymbol";
import { useColorScheme } from "@/components/useColorScheme";
import {
  brand,
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/design-system/tokens";

type ActionTone = "neutral" | "primary" | "danger";

type Props = {
  visible: boolean;
  workspaceName: string;
  busy?: boolean;
  onClose: () => void;
  onEnter: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function ActionRow({
  label,
  onPress,
  disabled,
  tone,
  fallback,
  showDivider = true,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone: ActionTone;
  fallback: string;
  showDivider?: boolean;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const toneStyle: Record<
    ActionTone,
    { bg: string; icon: string; label: string }
  > = {
    neutral: {
      bg: theme.section,
      icon: theme.textBody,
      label: theme.text,
    },
    primary: {
      bg: brand.accent,
      icon: brand.primary,
      label: brand.primary,
    },
    danger: {
      bg: "#FDECEC",
      icon: theme.danger,
      label: theme.danger,
    },
  };

  const colorsForTone = toneStyle[tone];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        paddingVertical: spacing[3] + 2,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: theme.border,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.full,
          backgroundColor: colorsForTone.bg,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <FallbackSymbol fallback={fallback} color={colorsForTone.icon} size={18} />
      </View>

      <Text
        style={{
          ...typography.label,
          color: colorsForTone.label,
          fontWeight: "700",
          flex: 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function WorkspaceBrowserActionsSheet({
  visible,
  workspaceName,
  busy,
  onClose,
  onEnter,
  onEdit,
  onDelete,
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
      onRequestClose={busy ? undefined : onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("workspaceBrowser.close")}
          onPress={busy ? undefined : onClose}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(31, 43, 69, 0.32)",
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
            onPress={onClose}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t("workspaceBrowser.close")}
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
              marginTop: -spacing[2],
              marginBottom: spacing[2],
              paddingRight: spacing[10],
            }}
            numberOfLines={2}
          >
            {workspaceName}
          </Text>

          <View style={{ marginTop: spacing[2] }}>
            <ActionRow
              label={t("workspaceBrowser.enter")}
              onPress={onEnter}
              disabled={busy}
              tone="primary"
              fallback="→"
            />
            <ActionRow
              label={t("workspaceBrowser.edit")}
              onPress={onEdit}
              disabled={busy}
              tone="neutral"
              fallback="✎"
            />
            <ActionRow
              label={t("workspaceBrowser.delete")}
              onPress={onDelete}
              disabled={busy}
              tone="danger"
              fallback="⌫"
              showDivider={false}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
