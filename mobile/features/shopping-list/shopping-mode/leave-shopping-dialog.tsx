import { Image, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

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

type Props = {
  visible: boolean;
  onStay: () => void;
  onLeave: () => void;
};

/**
 * Branded confirm sheet when leaving Shopping Mode (replaces system Alert).
 */
export function LeaveShoppingDialog({ visible, onStay, onLeave }: Props) {
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
      onRequestClose={onStay}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("shoppingMode.exitStay")}
          onPress={onStay}
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
            onPress={onStay}
            accessibilityRole="button"
            accessibilityLabel={t("shoppingMode.exitStay")}
            hitSlop={12}
            style={{
              alignSelf: "flex-end",
              width: 36,
              height: 36,
              borderRadius: radius.full,
              backgroundColor: theme.section,
              alignItems: "center",
              justifyContent: "center",
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
              source={brandAssets.leaveShopping}
              style={{ width: 200, height: 238, resizeMode: "contain" }}
              accessibilityLabel=""
            />
          </View>

          <Text
            style={{
              ...typography.title,
              color: theme.text,
              textAlign: "center",
              marginTop: spacing[5],
            }}
          >
            {t("shoppingMode.exitTitle")}
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
            {t("shoppingMode.exitBody")}
          </Text>

          <Pressable
            onPress={onStay}
            style={{
              marginTop: spacing[6],
              minHeight: 56,
              borderRadius: radius.full,
              borderWidth: 1.5,
              borderColor: brand.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ ...typography.label, color: brand.primary }}>
              {t("shoppingMode.exitStay")}
            </Text>
          </Pressable>

          <Pressable
            onPress={onLeave}
            style={{
              marginTop: spacing[3],
              minHeight: 56,
              borderRadius: radius.full,
              backgroundColor: brand.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("shoppingMode.exitLeave")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
