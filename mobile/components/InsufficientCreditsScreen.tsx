import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { DEFAULT_PREMIUM_PRODUCT } from "@shared/billing";
import type { BillingProduct } from "@shared/billing";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import {
  brand,
  colors,
  radius,
  spacing,
  typography,
} from "@/design-system/tokens";
import { BillingService } from "@/features/billing/billing-service";
import { usePremiumPrice } from "@/features/billing/usePremiumPrice";

/** Same trial badge colors as PremiumScreen. */
const TRIAL_BADGE_BG = "#FFF3CD";
const TRIAL_BADGE_TEXT = "#8A6A1A";

export type InsufficientCreditsScreenProps = {
  visible: boolean;
  needed: number;
  remaining: number;
  /** Override default body copy (e.g. meal-proposal specific). */
  description?: string;
  onPremium: () => void;
  onBack: () => void;
};

/**
 * Full-screen “no AI credits” gate: mascot · title · need/have · Premium CTA · back.
 * Purchase footer matches PremiumScreen (price → try-free CTA → badge → cancel).
 */
export function InsufficientCreditsScreen({
  visible,
  needed,
  remaining,
  description,
  onPremium,
  onBack,
}: InsufficientCreditsScreenProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();

  const useStorePrice = BillingService.capabilities().priceSource === "store";
  // Always fetch backend price when the gate is open — on Android DEV the Play
  // package (app.kangur.dev) often has no products, so store price stays empty.
  const priceQuery = usePremiumPrice(visible);
  const [storeProducts, setStoreProducts] = useState<BillingProduct[]>([]);

  useEffect(() => {
    if (!visible || !useStorePrice) return;
    let cancelled = false;
    void (async () => {
      try {
        await BillingService.initialize();
        const products = await BillingService.availableProducts();
        if (!cancelled) setStoreProducts(products);
      } catch {
        if (!cancelled) setStoreProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, useStorePrice]);

  if (!visible) return null;

  const body =
    description ?? t("ai.insufficientCreditsBody");
  const neededLabel = t("ai.insufficientCreditsAmount", { count: needed });
  const remainingLabel = t("ai.insufficientCreditsAmount", {
    count: remaining,
  });

  const primaryProduct =
    storeProducts.find((p) => p.productId === DEFAULT_PREMIUM_PRODUCT) ??
    storeProducts[0];
  const storeFormatted =
    useStorePrice && primaryProduct?.displayPrice
      ? primaryProduct.displayPrice
      : null;
  const priceFormatted =
    storeFormatted || priceQuery.data?.formatted || null;
  const priceInterval =
    (useStorePrice && primaryProduct?.billingInterval
      ? primaryProduct.billingInterval
      : null) ||
    priceQuery.data?.interval ||
    null;
  const priceLoading =
    !priceFormatted &&
    ((useStorePrice && storeProducts.length === 0 && !priceQuery.data) ||
      priceQuery.isPending);

  const intervalSuffix =
    priceInterval === "year"
      ? t("billing.priceYearlySuffix")
      : priceInterval === "week"
        ? t("billing.priceWeeklySuffix")
        : priceInterval === "day"
          ? t("billing.priceDailySuffix")
          : t("billing.priceMonthlySuffix");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onBack}
    >
      <Screen
        style={{ backgroundColor: theme.bg }}
        edges={["top", "bottom"]}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing[6],
            paddingTop: spacing[8],
            paddingBottom: spacing[6] + insets.bottom,
            alignItems: "center",
            flexGrow: 1,
            justifyContent: "center",
          }}
          bounces={false}
        >
          <Image
            source={brandAssets.noCredits}
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
            {t("ai.insufficientCreditsTitle")}
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
            {body}
          </Text>

          <View
            style={{
              marginTop: spacing[6],
              alignSelf: "stretch",
              flexDirection: "row",
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: radius.lg,
              backgroundColor: theme.surface,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flex: 1,
                paddingVertical: spacing[4],
                paddingHorizontal: spacing[3],
                alignItems: "center",
                gap: spacing[1],
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  textAlign: "center",
                }}
              >
                {t("ai.insufficientCreditsNeed")}
              </Text>
              <Text
                style={{
                  ...typography.label,
                  color: theme.text,
                  textAlign: "center",
                }}
              >
                {neededLabel}
              </Text>
            </View>

            <View
              style={{
                width: 1,
                alignSelf: "stretch",
                backgroundColor: theme.border,
              }}
            />

            <View
              style={{
                flex: 1,
                paddingVertical: spacing[4],
                paddingHorizontal: spacing[3],
                alignItems: "center",
                gap: spacing[1],
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  textAlign: "center",
                }}
              >
                {t("ai.insufficientCreditsHave")}
              </Text>
              <Text
                style={{
                  ...typography.label,
                  color: theme.text,
                  textAlign: "center",
                }}
              >
                {remainingLabel}
              </Text>
            </View>
          </View>

          <View
            style={{
              marginTop: spacing[8],
              alignSelf: "stretch",
              gap: spacing[3],
            }}
          >
            {priceLoading ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <Text
                style={{
                  ...typography.title,
                  fontSize: 24,
                  lineHeight: 30,
                  color: theme.text,
                  textAlign: "center",
                }}
              >
                {priceFormatted ?? "-"}
                <Text
                  style={{
                    ...typography.body,
                    fontWeight: "400",
                    color: theme.textMuted,
                  }}
                >
                  {intervalSuffix}
                </Text>
              </Text>
            )}

            <Pressable
              onPress={onPremium}
              accessibilityRole="button"
              accessibilityLabel={t("billing.tryFreeCta")}
              style={{
                backgroundColor: brand.primary,
                borderRadius: radius.full,
                paddingVertical: spacing[4],
                alignItems: "center",
              }}
            >
              <Text
                style={{ ...typography.label, color: "#fff", fontSize: 16 }}
              >
                {t("billing.tryFreeCta")}
              </Text>
            </Pressable>

            <View
              style={{
                alignSelf: "center",
                backgroundColor: TRIAL_BADGE_BG,
                borderRadius: radius.full,
                paddingVertical: spacing[2],
                paddingHorizontal: spacing[4],
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  fontWeight: "600",
                  color: TRIAL_BADGE_TEXT,
                  textAlign: "center",
                }}
              >
                {t("billing.trialBadge")}
              </Text>
            </View>

            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                textAlign: "center",
              }}
            >
              {t("billing.cancelAnytime")}
            </Text>

            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={t("common.return")}
              style={{
                paddingVertical: spacing[3],
                alignItems: "center",
              }}
            >
              <Text style={{ ...typography.label, color: theme.primary }}>
                {t("common.return")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </Screen>
    </Modal>
  );
}
