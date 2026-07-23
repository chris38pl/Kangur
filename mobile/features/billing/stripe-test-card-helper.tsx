import * as Clipboard from "expo-clipboard";
import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/design-system/tokens";
import { getAppBuildInfo } from "@/lib/app-build-info";

/** Stripe test Visa — succeeds in test mode; any future expiry + any CVC. */
export const STRIPE_TEST_VISA = {
  number: "4242424242424242",
  numberDisplay: "4242 4242 4242 4242",
  exp: "12/34",
  cvc: "123",
  name: "TEST USER",
} as const;

/** Staging = EAS `preview`. Never show on production builds. */
export function shouldShowStripeTestCardHelper(): boolean {
  const env = getAppBuildInfo().environment;
  return env === "development" || env === "preview";
}

function MiniCardIcon({ size = 22 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size * 0.68,
        borderRadius: 3,
        backgroundColor: "#1A237E",
        padding: 2,
        justifyContent: "space-between",
      }}
    >
      <View
        style={{
          width: size * 0.22,
          height: size * 0.16,
          borderRadius: 1,
          backgroundColor: "#F4C542",
        }}
      />
      <View
        style={{
          height: 2,
          width: "70%",
          borderRadius: 1,
          backgroundColor: "rgba(255,255,255,0.55)",
        }}
      />
    </View>
  );
}

function CopyRow({
  label,
  value,
  displayValue,
}: {
  label: string;
  value: string;
  displayValue?: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, [value]);

  return (
    <Pressable
      onPress={() => void onCopy()}
      accessibilityRole="button"
      accessibilityLabel={`${t("billing.testCard.copy")} ${label}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing[3],
        paddingVertical: spacing[2],
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            ...typography.caption,
            color: "rgba(255,255,255,0.65)",
            marginBottom: 2,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 15,
            lineHeight: 20,
            fontWeight: "600",
            color: "#FFFFFF",
            letterSpacing: 0.4,
          }}
          numberOfLines={1}
        >
          {displayValue ?? value}
        </Text>
      </View>
      <Text
        style={{
          ...typography.caption,
          fontWeight: "600",
          color: copied ? "#A7F3D0" : "#93C5FD",
        }}
      >
        {copied ? t("billing.testCard.copied") : t("billing.testCard.copy")}
      </Text>
    </Pressable>
  );
}

function VisaTestCardFace() {
  const { t } = useTranslation();

  return (
    <View
      style={{
        borderRadius: radius.xl,
        overflow: "hidden",
        backgroundColor: "#1A237E",
        ...shadows.fab,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: -40,
          right: -30,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -50,
          left: -20,
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: "rgba(67,191,168,0.15)",
        }}
      />

      <View style={{ padding: spacing[5], gap: spacing[3] }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              width: 42,
              height: 32,
              borderRadius: 6,
              backgroundColor: "#F4C542",
              borderWidth: 1,
              borderColor: "#D4A017",
            }}
          />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              fontStyle: "italic",
              color: "#FFFFFF",
              letterSpacing: 1,
            }}
          >
            VISA
          </Text>
        </View>

        <CopyRow
          label={t("billing.testCard.numberLabel")}
          value={STRIPE_TEST_VISA.number}
          displayValue={STRIPE_TEST_VISA.numberDisplay}
        />

        <View style={{ flexDirection: "row", gap: spacing[4] }}>
          <View style={{ flex: 1 }}>
            <CopyRow
              label={t("billing.testCard.expLabel")}
              value={STRIPE_TEST_VISA.exp}
            />
          </View>
          <View style={{ flex: 1 }}>
            <CopyRow
              label={t("billing.testCard.cvcLabel")}
              value={STRIPE_TEST_VISA.cvc}
            />
          </View>
        </View>

        <CopyRow
          label={t("billing.testCard.nameLabel")}
          value={STRIPE_TEST_VISA.name}
        />
      </View>
    </View>
  );
}

type Props = {
  /** Extra bottom offset so the FAB sits above a sticky footer. */
  footerClearance?: number;
};

/**
 * Floating Stripe test-card helper for non-production builds only.
 * Opens a bottom sheet with a Visa-like card and copyable 4242… credentials.
 */
export function StripeTestCardHelper({ footerClearance = 0 }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  if (!shouldShowStripeTestCardHelper()) return null;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t("billing.testCard.fabA11y")}
        style={{
          position: "absolute",
          right: spacing[4],
          bottom: footerClearance + spacing[3],
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          alignItems: "center",
          justifyContent: "center",
          ...shadows.fab,
        }}
      >
        <MiniCardIcon />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("billing.testCard.close")}
            onPress={() => setOpen(false)}
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
              backgroundColor: theme.bg,
              borderTopLeftRadius: radius.sheet,
              borderTopRightRadius: radius.sheet,
              maxHeight: "92%",
              paddingBottom: Math.max(insets.bottom, spacing[4]) + spacing[3],
              ...shadows.soft,
            }}
          >
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: spacing[5],
                paddingTop: spacing[5],
                paddingBottom: spacing[2],
                gap: spacing[4],
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing[3],
                }}
              >
                <Text
                  style={{
                    ...typography.headline,
                    color: theme.text,
                    flex: 1,
                  }}
                >
                  {t("billing.testCard.title")}
                </Text>
                <Pressable
                  onPress={() => setOpen(false)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={t("billing.testCard.close")}
                  style={{
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
              </View>

              <Text style={{ ...typography.body, color: theme.textBody }}>
                {t("billing.testCard.body")}
              </Text>

              <VisaTestCardFace />

              <Text style={{ ...typography.caption, color: theme.textMuted }}>
                {t("billing.testCard.hint")}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
