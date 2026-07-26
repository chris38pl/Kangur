import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
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
import { ToastMotion } from "@/lib/motion";

type Props = {
  visible: boolean;
  version: string;
  onDismiss: () => void;
};

const AUTO_DISMISS_MS = 8_000;

/**
 * Bottom toast after upgrade: kangaroo + update title + tap-for-details hint.
 * Tap navigates to What's New; does not dump changelog inline.
 */
export function WhatsNewToast({ visible, version, onDismiss }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      queueMicrotask(() => setRendered(true));
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const handle = setTimeout(() => {
      onDismiss();
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(handle);
  }, [visible, onDismiss]);

  if (!rendered) return null;

  const openDetails = () => {
    onDismiss();
    router.push("/whats-new" as never);
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom: insets.bottom + spacing[4],
        left: spacing[4],
        right: spacing[4],
        zIndex: 60,
      }}
    >
      <ToastMotion
        visible={visible}
        onExited={() => {
          if (!visible) setRendered(false);
        }}
      >
        <Pressable
          onPress={openDetails}
          accessibilityRole="button"
          accessibilityLabel={`${t("whatsNew.toastTitle", { version })}. ${t("whatsNew.toastHint")}`}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[3],
            backgroundColor: theme.surface,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: theme.border,
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[3],
            ...shadows.soft,
          }}
        >
          <Image
            source={brandAssets.icon}
            style={{ width: 44, height: 44, borderRadius: radius.lg }}
            accessibilityIgnoresInvertColors
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={2}
              style={{
                ...typography.label,
                color: theme.text,
                fontWeight: "700",
              }}
            >
              {t("whatsNew.toastTitle", { version })}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                ...typography.caption,
                color: theme.textMuted,
                marginTop: 2,
              }}
            >
              {t("whatsNew.toastHint")}
            </Text>
          </View>
        </Pressable>
      </ToastMotion>
    </View>
  );
}
