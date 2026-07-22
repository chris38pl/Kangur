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
import { BackIcon } from "@/features/auth/auth-icons";

export type PreferredForAiSheetVariant = "added" | "removed" | "limit";

type Props = {
  visible: boolean;
  variant: PreferredForAiSheetVariant;
  onClose: () => void;
};

/**
 * Star feedback sheet - added / removed / max-5 limit.
 */
export function PreferredForAiSheet({ visible, variant, onClose }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();

  const titleKey =
    variant === "added"
      ? "history.aiPreferredAddedTitle"
      : variant === "removed"
        ? "history.aiPreferredRemovedTitle"
        : "history.aiPreferredLimitTitle";

  const bodyKey =
    variant === "added"
      ? "history.aiPreferredAddedBody"
      : variant === "removed"
        ? "history.aiPreferredRemovedBody"
        : "history.aiPreferredLimitBody";

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
          accessibilityLabel={t("common.back")}
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
            paddingTop: spacing[4],
            paddingBottom: Math.max(insets.bottom, spacing[4]) + spacing[4],
            ...shadows.soft,
          }}
        >
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: -spacing[2],
            }}
          >
            <BackIcon size={20} />
          </Pressable>

          <View style={{ alignItems: "center", marginTop: spacing[2] }}>
            <Image
              source={brandAssets.createListMascot}
              style={{
                width: 140,
                height: 168,
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
              {t(titleKey)}
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
              {t(bodyKey)}
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t("history.continue")}
            style={{
              marginTop: spacing[6],
              backgroundColor: theme.primary,
              borderRadius: radius.full,
              paddingVertical: spacing[4],
              alignItems: "center",
            }}
          >
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("history.continue")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
