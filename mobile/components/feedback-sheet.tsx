import {
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/design-system/tokens";

export type FeedbackSheetProps = {
  visible: boolean;
  image: ImageSourcePropType;
  title: string;
  body?: string;
  primaryLabel: string;
  onPrimary: () => void;
  /** When set, shows a secondary text CTA below primary (usually Cancel / Back). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Style primary as danger (destructive confirms). */
  primaryDestructive?: boolean;
  busy?: boolean;
  /** Image box size; default matches invite / preferred sheets. */
  imageWidth?: number;
  imageHeight?: number;
};

/**
 * Shared branded bottom sheet: image → heading → text → 1–2 CTAs.
 * Use for success, confirm/destructive, and informational UX (not API errors).
 */
export function FeedbackSheet({
  visible,
  image,
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  primaryDestructive = false,
  busy = false,
  imageWidth = 180,
  imageHeight = 160,
}: FeedbackSheetProps) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();

  const dismiss = () => {
    if (busy) return;
    if (secondaryLabel && onSecondary) {
      onSecondary();
      return;
    }
    onPrimary();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel ?? primaryLabel}
          onPress={dismiss}
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
              source={image}
              style={{
                width: imageWidth,
                height: imageHeight,
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
              {title}
            </Text>

            {body ? (
              <Text
                style={{
                  ...typography.body,
                  color: theme.textBody,
                  textAlign: "center",
                  marginTop: spacing[2],
                  paddingHorizontal: spacing[2],
                }}
              >
                {body}
              </Text>
            ) : null}
          </View>

          <Pressable
            disabled={busy}
            onPress={onPrimary}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
            style={{
              marginTop: spacing[6],
              minHeight: 56,
              borderRadius: radius.full,
              backgroundColor: primaryDestructive
                ? theme.danger
                : theme.primary,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: spacing[4],
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <Text style={{ ...typography.label, color: theme.onPrimary }}>
                {primaryLabel}
              </Text>
            )}
          </Pressable>

          {secondaryLabel && onSecondary ? (
            <Pressable
              disabled={busy}
              onPress={onSecondary}
              accessibilityRole="button"
              accessibilityLabel={secondaryLabel}
              style={{
                marginTop: spacing[3],
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ ...typography.label, color: theme.textMuted }}>
                {secondaryLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
