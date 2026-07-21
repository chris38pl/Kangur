import {
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";

export type AppResultVariant = "error" | "info" | "success";

type Props = {
  visible: boolean;
  variant?: AppResultVariant;
  title: string;
  description?: string;
  primaryLabel?: string;
  onPrimary: () => void;
  /** Optional secondary CTA (e.g. “Go back” when primary is “Try again”). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  onBack?: () => void;
  /** Override default mascot for the variant. */
  image?: ImageSourcePropType;
  /**
   * `modal` - full-screen overlay (default).
   * `sheet` - page sheet over the current screen (keeps what is underneath).
   * `embedded` - render as a route Screen.
   * `cover` - body only; caller overlays it inside an existing Modal/screen.
   */
  presentation?: "modal" | "sheet" | "embedded" | "cover";
};

function defaultImage(variant: AppResultVariant): ImageSourcePropType {
  if (variant === "error") return brandAssets.error;
  if (variant === "success") return brandAssets.listCreated;
  return brandAssets.createListMascot;
}

/**
 * Full-screen result / error UI (same composition as shopping-started notification):
 * back · mascot · title · description · primary CTA.
 */
export function AppResultScreen({
  visible,
  variant = "error",
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onBack,
  image,
  presentation = "modal",
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const cta = primaryLabel ?? t("common.continue");
  const source = image ?? defaultImage(variant);

  const body = (
    <>
      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[2],
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BackIcon size={20} />
          </Pressable>
        ) : (
          <View style={{ width: 40, height: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[6],
          paddingBottom: spacing[6] + insets.bottom,
          alignItems: "center",
          flexGrow: 1,
          justifyContent: "center",
        }}
        bounces={false}
      >
        <Image
          source={source}
          style={{ width: 220, height: 220, resizeMode: "contain" }}
          accessibilityLabel=""
        />

        <Text
          style={{
            ...typography.title,
            fontSize: 22,
            lineHeight: 30,
            color: theme.text,
            textAlign: "center",
            marginTop: spacing[5],
          }}
        >
          {title}
        </Text>

        {description ? (
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              textAlign: "center",
              marginTop: spacing[3],
              paddingHorizontal: spacing[2],
            }}
          >
            {description}
          </Text>
        ) : null}

        <View
          style={{
            marginTop: spacing[8],
            alignSelf: "stretch",
            gap: spacing[3],
          }}
        >
          <Pressable
            onPress={onPrimary}
            accessibilityRole="button"
            accessibilityLabel={cta}
            style={{
              backgroundColor: theme.primary,
              borderRadius: radius.full,
              paddingVertical: spacing[4],
              alignItems: "center",
            }}
          >
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {cta}
            </Text>
          </Pressable>

          {secondaryLabel ? (
            <Pressable
              onPress={onSecondary ?? onBack ?? onPrimary}
              accessibilityRole="button"
              accessibilityLabel={secondaryLabel}
              style={{
                backgroundColor: theme.section,
                borderRadius: radius.full,
                paddingVertical: spacing[4],
                alignItems: "center",
              }}
            >
              <Text style={{ ...typography.label, color: theme.text }}>
                {secondaryLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </>
  );

  if ((presentation === "modal" || presentation === "sheet") && !visible) {
    return null;
  }

  if (presentation === "cover") {
    if (!visible) return null;
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
        {body}
      </View>
    );
  }

  if (presentation === "embedded") {
    return (
      <Screen style={{ backgroundColor: theme.bg }} edges={["top", "bottom"]}>
        {body}
      </Screen>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={presentation === "sheet" ? "pageSheet" : "fullScreen"}
      // Stack above other Modals (e.g. suggest-from-history sheet).
      statusBarTranslucent
      onRequestClose={onBack ?? onPrimary}
    >
      <Screen
        style={{ backgroundColor: theme.bg }}
        edges={presentation === "sheet" ? ["bottom"] : ["top", "bottom"]}
      >
        {body}
      </Screen>
    </Modal>
  );
}
