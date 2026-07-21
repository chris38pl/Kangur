import { ActivityIndicator, Image, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { FallbackSymbol } from "@/components/FallbackSymbol";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import {
  brand,
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/design-system/tokens";

type ActionsMode = "shopping" | "waiting" | "archived";

type ActionTone = "neutral" | "primary" | "restore" | "danger";

type Props = {
  visible: boolean;
  listName: string;
  mode: ActionsMode;
  preferredForAi?: boolean;
  busy?: boolean;
  onClose: () => void;
  onPreview: () => void;
  onShop: () => void;
  onRepeat: () => void;
  onRestore: () => void;
  onTogglePreferred: () => void;
  onDelete: () => void;
};

function ActionIcon({
  color,
  fallback,
}: {
  color: string;
  fallback: string;
}) {
  return <FallbackSymbol fallback={fallback} color={color} size={15} />;
}

function ActionRow({
  label,
  subtitle,
  onPress,
  disabled,
  tone,
  fallback,
  iconColor,
  showDivider = true,
}: {
  label: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  tone: ActionTone;
  fallback: string;
  iconColor?: string;
  showDivider?: boolean;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const toneStyle: Record<ActionTone, { bg: string; icon: string; label: string }> = {
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
    restore: {
      bg: "#E8F2FB",
      icon: "#4A7FB5",
      label: theme.text,
    },
    danger: {
      bg: "#FDECEC",
      icon: theme.danger,
      label: theme.danger,
    },
  };

  const colorsForTone = toneStyle[tone];
  const resolvedIcon = iconColor ?? colorsForTone.icon;

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
        <ActionIcon color={resolvedIcon} fallback={fallback} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            ...typography.label,
            color: colorsForTone.label,
            fontWeight: "700",
          }}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * List overflow - Preview / Shop / Repeat / Restore / Delete.
 */
export function HistoryActionsSheet({
  visible,
  listName,
  mode,
  preferredForAi = false,
  busy = false,
  onClose,
  onPreview,
  onShop,
  onRepeat,
  onRestore,
  onTogglePreferred,
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
          accessibilityLabel={t("history.cancel")}
          onPress={busy ? undefined : onClose}
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
            onPress={onClose}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t("history.cancel")}
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
              zIndex: 2,
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

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: spacing[3],
              marginTop: -spacing[2],
              marginBottom: spacing[3],
              paddingRight: spacing[1],
            }}
          >
            <View style={{ flex: 1, minWidth: 0, paddingTop: spacing[2] }}>
              <Text
                style={{ ...typography.title, color: theme.text }}
                numberOfLines={2}
              >
                {listName}
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  marginTop: spacing[1],
                }}
              >
                {t("history.actionsSubtitle")}
              </Text>
            </View>

            <Image
              source={brandAssets.createListMascot}
              style={{
                width: 112,
                height: 134,
                marginTop: spacing[1],
                resizeMode: "contain",
              }}
              accessibilityLabel=""
            />
          </View>

          {busy ? (
            <View style={{ paddingVertical: spacing[8], alignItems: "center" }}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : (
            <View style={{ marginTop: spacing[2] }}>
              <ActionRow
                label={t("history.preview")}
                subtitle={t("history.previewHint")}
                onPress={onPreview}
                tone="neutral"
                fallback="◉"
              />
              <ActionRow
                label={
                  preferredForAi
                    ? t("history.removeFromAi")
                    : t("history.useForAi")
                }
                subtitle={t("history.useForAiHint")}
                onPress={onTogglePreferred}
                tone="neutral"
                iconColor={preferredForAi ? brand.starActive : undefined}
                fallback={preferredForAi ? "★" : "☆"}
              />
              {mode === "shopping" ? (
                <ActionRow
                  label={t("history.continueShopping")}
                  subtitle={t("history.continueShoppingHint")}
                  onPress={onShop}
                  tone="primary"
                  fallback="🛒"
                />
              ) : null}
              {mode === "waiting" ? (
                <ActionRow
                  label={t("history.startShopping")}
                  subtitle={t("history.startShoppingHint")}
                  onPress={onShop}
                  tone="primary"
                  fallback="🛒"
                />
              ) : null}
              {mode === "archived" ? (
                <>
                  <ActionRow
                    label={t("history.repeat")}
                    subtitle={t("history.repeatHint")}
                    onPress={onRepeat}
                    tone="primary"
                    fallback="↻"
                  />
                  <ActionRow
                    label={t("history.restore")}
                    subtitle={t("history.restoreHint")}
                    onPress={onRestore}
                    tone="restore"
                    fallback="↩"
                  />
                </>
              ) : null}
              <ActionRow
                label={t("list.delete")}
                subtitle={t("history.deleteHint")}
                onPress={onDelete}
                tone="danger"
                fallback="⌫"
                showDivider={false}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
