import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import type { BillingProduct } from "@shared/billing";
import { DEFAULT_PREMIUM_PRODUCT } from "@shared/billing";

import { Screen } from "@/components/Screen";
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
import { BackIcon, LockFieldIcon } from "@/features/auth/auth-icons";
import { BillingService } from "@/features/billing/billing-service";
import type { PurchaseState } from "@/features/billing/types";
import { StripeTestCardHelper } from "@/features/billing/stripe-test-card-helper";
import { usePremiumPrice } from "@/features/billing/usePremiumPrice";
import {
  ProfileIconList,
  ProfileIconShield,
  ProfileIconStar,
} from "@/features/profile/profile-icons";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { Analytics } from "@/lib/analytics";
import { ApiClientError } from "@/lib/api/client";

const activatingKey = (workspaceId: string) =>
  `kangur.billing.activating.${workspaceId}`;

/**
 * Stripe Checkout must open from a user gesture on web. After `await createCheckout`,
 * `window.open` is often blocked — open a blank tab sync on click, then navigate it.
 * If that fails, same-tab redirect (requires BILLING_RETURN_URL_BASE → web /premium).
 */
function openStripeCheckoutUrl(
  url: string,
  pendingWindow: Window | null,
): void {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (pendingWindow && !pendingWindow.closed) {
      pendingWindow.location.href = url;
      try {
        pendingWindow.focus();
      } catch {
        // ignore
      }
      return;
    }
    window.location.assign(url);
    return;
  }
  void WebBrowser.openBrowserAsync(url);
}
const TRIAL_BADGE_BG = "#FFF3CD";
const TRIAL_BADGE_TEXT = "#8A6A1A";
const FEATURE_ICON_BG = "#E8F8F4";
const CROWN_CIRCLE_BG = "#E8F8F4";
/** Matches Stripe Checkout trial_period_days. */
const TRIAL_PERIOD_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysUntil(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.ceil((end - now) / MS_PER_DAY));
}

function trialProgress(
  periodEndIso: string | null | undefined,
  now = Date.now(),
): number {
  if (!periodEndIso) return 0;
  const end = new Date(periodEndIso).getTime();
  if (Number.isNaN(end)) return 0;
  const start = end - TRIAL_PERIOD_DAYS * MS_PER_DAY;
  const total = end - start;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now - start) / total));
}

function formatPeriodEndDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function PremiumHeroBadge() {
  return (
    <Image
      source={brandAssets.premiumActive}
      style={{
        width: 200,
        height: 200,
        resizeMode: "contain",
        marginBottom: spacing[2],
      }}
      accessibilityLabel=""
    />
  );
}

function BenefitCheckRow({ label }: { label: string }) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing[3],
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: CROWN_CIRCLE_BG,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
        }}
      >
        <Text
          style={{
            color: brand.primary,
            fontSize: 13,
            fontWeight: "700",
            lineHeight: 16,
          }}
        >
          ✓
        </Text>
      </View>
      <Text
        style={{
          ...typography.body,
          color: theme.text,
          flex: 1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function PremiumActiveView({
  billingStatus,
  currentPeriodEnd,
  canManage,
  busy,
  onPortal,
}: {
  billingStatus: string;
  currentPeriodEnd: string | null;
  canManage: boolean;
  busy: boolean;
  onPortal: () => void;
}) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const isTrialing = billingStatus === "trialing";
  const isCancelled = billingStatus === "cancelled";
  const daysLeft = daysUntil(currentPeriodEnd);
  const progress = isTrialing ? trialProgress(currentPeriodEnd) : 0;
  const endLabel = currentPeriodEnd
    ? formatPeriodEndDate(currentPeriodEnd, i18n.language)
    : null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingTop: spacing[2],
          paddingBottom: spacing[6],
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <PremiumHeroBadge />

        <Text
          style={{
            ...typography.title,
            fontSize: 28,
            lineHeight: 34,
            color: theme.text,
            textAlign: "center",
          }}
        >
          {t("billing.premiumActiveTitle")}
        </Text>
        <Text
          style={{
            ...typography.body,
            color: theme.textBody,
            textAlign: "center",
            marginTop: spacing[2],
            marginBottom: spacing[4],
            paddingHorizontal: spacing[2],
          }}
        >
          {isTrialing
            ? t("billing.premiumActiveSubtitleTrial")
            : t("billing.premiumActiveSubtitle")}
        </Text>

        {currentPeriodEnd && daysLeft != null ? (
          <View
            style={{
              width: "100%",
              backgroundColor: isCancelled ? "#FDECEC" : theme.surface,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: isCancelled ? "#F5C2C2" : theme.border,
              paddingVertical: spacing[5],
              paddingHorizontal: spacing[4],
              alignItems: "center",
              marginBottom: spacing[5],
            }}
          >
            <Text
              style={{
                ...typography.caption,
                fontWeight: isCancelled ? "600" : "400",
                color: isCancelled ? theme.danger : theme.textMuted,
                textAlign: "center",
              }}
            >
              {isCancelled
                ? t("billing.cancelledRemainingLabel")
                : isTrialing
                  ? t("billing.trialRemainingLabel")
                  : t("billing.activeRenewalLabel")}
            </Text>
            <Text
              style={{
                ...typography.title,
                fontSize: 36,
                lineHeight: 42,
                color: isCancelled ? theme.danger : brand.primary,
                marginTop: spacing[2],
                textAlign: "center",
              }}
            >
              {t("billing.trialDaysLeft", { count: daysLeft })}
            </Text>
            {endLabel ? (
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  marginTop: spacing[1],
                  textAlign: "center",
                }}
              >
                {isCancelled
                  ? t("billing.cancelledEndsOn", { date: endLabel })
                  : t("billing.trialUntil", { date: endLabel })}
              </Text>
            ) : null}
            {isTrialing || isCancelled ? (
              <View
                style={{
                  width: "100%",
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isCancelled ? "#F5C2C2" : theme.border,
                  marginTop: spacing[4],
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${Math.round((isCancelled ? trialProgress(currentPeriodEnd) : progress) * 100)}%`,
                    height: "100%",
                    borderRadius: 3,
                    backgroundColor: isCancelled ? theme.danger : brand.primary,
                  }}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ width: "100%", gap: spacing[3] }}>
          <BenefitCheckRow label={t("billing.featureUnlimitedCredits")} />
          <BenefitCheckRow label={t("billing.featureHistoryDepth")} />
          <BenefitCheckRow label={t("billing.featureGenerateFromHistory")} />
          {isTrialing && !isCancelled && daysLeft != null ? (
            <BenefitCheckRow
              label={t("billing.activeBenefitPaymentIn", { count: daysLeft })}
            />
          ) : null}
          {!isCancelled ? (
            <BenefitCheckRow label={t("billing.activeBenefitCancel")} />
          ) : null}
        </View>
      </ScrollView>

      {canManage ? (
        <View
          style={{
            paddingHorizontal: spacing[5],
            paddingTop: spacing[3],
            paddingBottom: spacing[3],
            borderTopWidth: 1,
            borderTopColor: theme.border,
            backgroundColor: theme.bg,
          }}
        >
          <Pressable
            onPress={onPortal}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t("billing.manageBillingCta")}
            style={{
              backgroundColor: brand.primary,
              borderRadius: radius.full,
              paddingVertical: spacing[4],
              alignItems: "center",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ ...typography.label, color: "#fff", fontSize: 16 }}>
                {t("billing.manageBillingCta")}
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function paramOne(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function FeatureRow({
  icon,
  label,
  textColor,
}: {
  icon: ReactNode;
  label: string;
  textColor: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.full,
          backgroundColor: FEATURE_ICON_BG,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          ...typography.body,
          fontWeight: "500",
          color: textColor,
          flex: 1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function CheckoutStepIcon({
  index,
  state,
}: {
  index: number;
  state: "done" | "active" | "pending";
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  if (state === "done") {
    return (
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: brand.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>✓</Text>
      </View>
    );
  }

  if (state === "active") {
    return (
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: CROWN_CIRCLE_BG,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={brand.primary} size="small" />
      </View>
    );
  }

  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.section,
        borderWidth: 1,
        borderColor: theme.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          ...typography.caption,
          fontWeight: "700",
          color: theme.textMuted,
        }}
      >
        {index}
      </Text>
    </View>
  );
}

function PremiumCheckoutProgressView({
  activeStep,
  onRefresh,
  onCancel,
  refreshing,
}: {
  /** 1–4: current step (completed = below this index). */
  activeStep: 1 | 2 | 3 | 4;
  onRefresh: () => void;
  onCancel: () => void;
  refreshing?: boolean;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const steps = [
    {
      title: t("billing.checkoutStep1Title"),
      subtitle: t("billing.checkoutStep1Body"),
    },
    {
      title: t("billing.checkoutStep2Title"),
      subtitle: t("billing.checkoutStep2Body"),
    },
    {
      title: t("billing.checkoutStep3Title"),
      subtitle: t("billing.checkoutStep3Body"),
    },
    {
      title: t("billing.checkoutStep4Title"),
      subtitle: t("billing.checkoutStep4Body"),
    },
  ] as const;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingTop: spacing[2],
          paddingBottom: spacing[6],
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={brandAssets.premiumActive}
          style={{
            width: 200,
            height: 200,
            resizeMode: "contain",
            marginBottom: spacing[3],
          }}
          accessibilityLabel=""
        />

        <Text
          style={{
            ...typography.title,
            fontSize: 26,
            lineHeight: 32,
            color: theme.text,
            textAlign: "center",
          }}
        >
          {t("billing.activatingTitle")}
        </Text>
        <Text
          style={{
            ...typography.body,
            color: theme.textBody,
            textAlign: "center",
            marginTop: spacing[2],
            marginBottom: spacing[5],
            paddingHorizontal: spacing[2],
          }}
        >
          {t("billing.activatingBody")}
        </Text>

        <View
          style={{
            width: "100%",
            backgroundColor: theme.surface,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: theme.border,
            paddingVertical: spacing[4],
            paddingHorizontal: spacing[4],
            marginBottom: spacing[4],
          }}
        >
          {steps.map((step, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3 | 4;
            const state =
              stepNum < activeStep
                ? "done"
                : stepNum === activeStep
                  ? "active"
                  : "pending";
            const isLast = i === steps.length - 1;

            return (
              <View
                key={step.title}
                style={{ flexDirection: "row", gap: spacing[3] }}
              >
                <View style={{ alignItems: "center", width: 28 }}>
                  <CheckoutStepIcon index={stepNum} state={state} />
                  {!isLast ? (
                    <View
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 20,
                        backgroundColor: theme.border,
                        marginVertical: 4,
                      }}
                    />
                  ) : null}
                </View>

                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "flex-start",
                    paddingBottom: isLast ? 0 : spacing[4],
                    gap: spacing[2],
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        ...typography.label,
                        color: theme.text,
                        fontWeight: "700",
                      }}
                    >
                      {step.title}
                    </Text>
                    <Text
                      style={{
                        ...typography.caption,
                        color: theme.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {step.subtitle}
                    </Text>
                  </View>
                  <Text
                    style={{
                      ...typography.caption,
                      color: theme.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {state === "done"
                      ? t("billing.checkoutStepDoneMeta")
                      : "···"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View
          style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: spacing[3],
            backgroundColor: CROWN_CIRCLE_BG,
            borderRadius: radius.xl,
            padding: spacing[4],
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LockFieldIcon size={18} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                ...typography.label,
                color: theme.text,
                fontWeight: "700",
              }}
            >
              {t("billing.checkoutSecureTitle")}
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                marginTop: 4,
              }}
            >
              {t("billing.checkoutSecureBody")}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: spacing[5],
          paddingTop: spacing[3],
          paddingBottom: spacing[3],
          gap: spacing[3],
          backgroundColor: theme.bg,
        }}
      >
        <Pressable
          onPress={onRefresh}
          disabled={refreshing}
          accessibilityRole="button"
          accessibilityLabel={t("billing.refresh")}
          style={{
            borderRadius: radius.full,
            borderWidth: 1.5,
            borderColor: brand.primary,
            paddingVertical: spacing[4],
            alignItems: "center",
            opacity: refreshing ? 0.7 : 1,
          }}
        >
          {refreshing ? (
            <ActivityIndicator color={brand.primary} />
          ) : (
            <Text
              style={{
                ...typography.label,
                color: brand.primary,
                fontSize: 16,
              }}
            >
              {t("billing.refresh")}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={t("billing.checkoutCancel")}
          style={{ alignItems: "center", paddingVertical: spacing[2] }}
        >
          <Text style={{ ...typography.label, color: brand.primary }}>
            {t("billing.checkoutCancel")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function PremiumPurchaseView({
  busy,
  canManage,
  onCheckout,
  onCheckStatus,
  showCheckStatus,
  supportsPurchase,
  unavailableReason,
  showStripeHelper,
  onOpenDebug,
  priceFormatted,
  priceInterval,
  priceLoading,
  /** Play / Apple: show verifying copy next to the CTA spinner. */
  showVerifyingPaymentCta = false,
}: {
  busy: boolean;
  canManage: boolean;
  onCheckout: () => void;
  /** Manual status check — only when silent sync failed / inconsistency. */
  onCheckStatus?: () => void;
  showCheckStatus?: boolean;
  supportsPurchase: boolean;
  unavailableReason?: "COMING_SOON" | "STORE_NOT_SUPPORTED" | null;
  showStripeHelper: boolean;
  onOpenDebug?: () => void;
  priceFormatted: string | null;
  priceInterval: "day" | "week" | "month" | "year" | null;
  priceLoading: boolean;
  showVerifyingPaymentCta?: boolean;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const intervalSuffix =
    priceInterval === "year"
      ? t("billing.priceYearlySuffix")
      : priceInterval === "week"
        ? t("billing.priceWeeklySuffix")
        : priceInterval === "day"
          ? t("billing.priceDailySuffix")
          : t("billing.priceMonthlySuffix");

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing[5],
            paddingTop: spacing[2],
            paddingBottom: spacing[6],
            alignItems: "center",
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={brandAssets.homeHero}
            style={{
              width: 220,
              height: 220,
              resizeMode: "contain",
              marginBottom: spacing[2],
            }}
            accessibilityLabel=""
          />

          <Text
            style={{
              ...typography.title,
              fontSize: 28,
              lineHeight: 34,
              color: theme.text,
              textAlign: "center",
            }}
          >
            {t("billing.purchaseTitle")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              textAlign: "center",
              marginTop: spacing[2],
              marginBottom: spacing[6],
              paddingHorizontal: spacing[2],
            }}
          >
            {t("billing.purchaseSubtitle")}
          </Text>

          <View
            style={{ width: "100%", gap: spacing[4], marginBottom: spacing[4] }}
          >
            <FeatureRow
              icon={<ProfileIconShield color={brand.primary} size={18} />}
              label={t("billing.featureUnlimitedCredits")}
              textColor={theme.text}
            />
            <FeatureRow
              icon={<ProfileIconList color={brand.primary} size={18} />}
              label={t("billing.featureHistoryDepth")}
              textColor={theme.text}
            />
            <FeatureRow
              icon={<ProfileIconStar color={brand.primary} size={18} />}
              label={t("billing.featureGenerateFromHistory")}
              textColor={theme.text}
            />
          </View>
        </ScrollView>

        {/* Non-production FABs — same height: debug left, Stripe test card right. */}
        {onOpenDebug ? (
          <Pressable
            onPress={onOpenDebug}
            accessibilityRole="button"
            accessibilityLabel={t("billing.debugTitle")}
            style={{
              position: "absolute",
              left: spacing[4],
              bottom: spacing[3],
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
            <Text
              style={{
                fontSize: 13,
                fontWeight: "800",
                letterSpacing: 0.2,
                color: theme.textMuted,
              }}
            >
              DBG
            </Text>
          </Pressable>
        ) : null}
        {showStripeHelper ? <StripeTestCardHelper /> : null}
      </View>

      <View
        style={{
          paddingHorizontal: spacing[5],
          paddingTop: spacing[4],
          paddingBottom: spacing[2],
          borderTopWidth: 1,
          borderTopColor: theme.border,
          backgroundColor: theme.bg,
          gap: spacing[3],
        }}
      >
        {priceLoading && !priceFormatted ? (
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

        {canManage && supportsPurchase ? (
          <Pressable
            onPress={onCheckout}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={
              busy && showVerifyingPaymentCta
                ? t("billing.verifyingPaymentCta")
                : t("billing.tryFreeCta")
            }
            style={{
              backgroundColor: brand.primary,
              borderRadius: radius.full,
              paddingVertical: spacing[4],
              alignItems: "center",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[2],
                }}
              >
                <ActivityIndicator color="#fff" />
                {showVerifyingPaymentCta ? (
                  <Text
                    style={{ ...typography.label, color: "#fff", fontSize: 16 }}
                  >
                    {t("billing.verifyingPaymentCta")}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={{ ...typography.label, color: "#fff", fontSize: 16 }}>
                {t("billing.tryFreeCta")}
              </Text>
            )}
          </Pressable>
        ) : canManage && !supportsPurchase ? (
          <Text
            style={{
              ...typography.body,
              color: theme.textMuted,
              textAlign: "center",
            }}
          >
            {unavailableReason === "COMING_SOON"
              ? t("billing.purchaseComingSoon")
              : t("billing.purchaseStoreUnsupported")}
          </Text>
        ) : (
          <Text
            style={{
              ...typography.body,
              color: theme.textMuted,
              textAlign: "center",
            }}
          >
            {t("billing.memberCannotManage")}
          </Text>
        )}

        {showCheckStatus && canManage && onCheckStatus ? (
          <Pressable
            onPress={onCheckStatus}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t("billing.checkPremiumStatus")}
            style={{ alignItems: "center", paddingVertical: spacing[2] }}
          >
            <Text style={{ ...typography.label, color: brand.primary }}>
              {t("billing.checkPremiumStatus")}
            </Text>
          </Pressable>
        ) : null}

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
            marginBottom: spacing[1],
          }}
        >
          {t("billing.cancelAnytime")}
        </Text>
      </View>
    </View>
  );
}

export function PremiumScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const router = useRouter();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{
    workspaceId?: string | string[];
    checkout?: string | string[];
  }>();

  const workspacesQuery = useWorkspaces();
  const caps = BillingService.capabilities();
  const useStorePrice = caps.priceSource === "store";
  const priceQuery = usePremiumPrice(!useStorePrice);
  const { activeWorkspace, setActiveId, hydrated } = useActiveWorkspace(
    workspacesQuery.data,
  );

  const paramWorkspaceId = paramOne(params.workspaceId);
  const checkout = paramOne(params.checkout);

  const workspace = useMemo(() => {
    if (paramWorkspaceId && workspacesQuery.data) {
      return (
        workspacesQuery.data.find((w) => w.id === paramWorkspaceId) ??
        activeWorkspace
      );
    }
    return activeWorkspace;
  }, [paramWorkspaceId, workspacesQuery.data, activeWorkspace]);

  const canManage =
    workspace?.role === "owner" || workspace?.role === "admin";

  const [activating, setActivating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4 | null>(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>("idle");
  const [storeProducts, setStoreProducts] = useState<BillingProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(useStorePrice);
  /** Shown only after silent restore/sync fails — never the default path. */
  const [showCheckStatus, setShowCheckStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await BillingService.initialize();
        if (cancelled) return;
        const token = await getToken();
        const products = await BillingService.availableProducts({
          authToken: token,
          workspaceId: workspace?.id,
        });
        if (!cancelled) setStoreProducts(products);
      } catch {
        // Price may stay empty; user can retry via restore / refresh
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      void BillingService.dispose();
    };
  }, [getToken, workspace?.id]);

  useEffect(() => {
    if (paramWorkspaceId) {
      void setActiveId(paramWorkspaceId);
    }
  }, [paramWorkspaceId, setActiveId]);

  useEffect(() => {
    if (!workspace || checkout !== "success") return;
    void AsyncStorage.setItem(activatingKey(workspace.id), "1").then(() => {
      setActivating(true);
      setCheckoutStep((current) => current ?? 3);
    });
  }, [workspace, checkout]);

  // Return from Stripe cancel, or a normal visit without checkout return —
  // never rehydrate a stale "activating" flag from a previous abandoned session.
  useEffect(() => {
    if (!workspace?.id) return;
    if (checkout === "success") return;
    const workspaceId = workspace.id;
    void AsyncStorage.removeItem(activatingKey(workspaceId)).then(() => {
      if (checkout === "cancel") {
        setActivating(false);
        setCheckoutStep(null);
      }
    });
  }, [workspace?.id, checkout]);

  useEffect(() => {
    if (!workspace || workspace.plan !== "premium") return;
    const workspaceId = workspace.id;
    void AsyncStorage.removeItem(activatingKey(workspaceId)).then(() => {
      setActivating(false);
      setCheckoutStep(null);
    });
  }, [workspace?.id, workspace?.plan]);

  const workspaceIdRef = useRef(workspace?.id);
  const planRef = useRef(workspace?.plan);
  const getTokenRef = useRef(getToken);
  const refetchWorkspacesRef = useRef(workspacesQuery.refetch);
  workspaceIdRef.current = workspace?.id;
  planRef.current = workspace?.plan;
  getTokenRef.current = getToken;
  refetchWorkspacesRef.current = workspacesQuery.refetch;

  // After Checkout, webhooks may be delayed (or missing locally). Sync from Stripe
  // and poll until plan flips to premium.
  // Deps intentionally omit getToken / refetch — unstable identities restarted the
  // interval every render and hammered /workspaces + Clerk.
  useEffect(() => {
    if (!workspace?.id || !activating || workspace.plan === "premium") return;
    if (!canManage) return;

    const workspaceId = workspace.id;
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 40; // ~3.3 min at 5s
    const INTERVAL_MS = 5_000;

    const pull = async () => {
      if (cancelled) return;
      attempts += 1;
      if (attempts > MAX_ATTEMPTS) {
        cancelled = true;
        setActivating(false);
        setCheckoutStep(null);
        void AsyncStorage.removeItem(activatingKey(workspaceId));
        return;
      }
      try {
        const token = await getTokenRef.current();
        if (!token || cancelled) return;
        // Stay on step 3 (payment confirmation) until Stripe entitlement is Premium.
        setCheckoutStep((s) => (s == null || s < 3 ? 3 : s === 4 ? 4 : 3));
        const synced = await BillingService.restore(token, workspaceId);
        if (cancelled) return;
        if (synced.plan === "premium") {
          setCheckoutStep(4);
        }
        await refetchWorkspacesRef.current();
      } catch {
        // Keep progress UI; user can Refresh / cancel.
      }
    };

    void pull();
    const interval = setInterval(() => {
      void pull();
    }, INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activating, canManage, workspace?.id, workspace?.plan]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        await refetchWorkspacesRef.current();
        const workspaceId = workspaceIdRef.current;
        if (workspaceId) {
          Analytics.track("paywall_viewed", {
            workspace_id: workspaceId,
            surface: "premium_screen",
          });
        }
        // Silent restore/sync for owners/admins — no loader, no toast on no-op.
        if (workspaceId == null || !canManage) return;
        try {
          const token = await getTokenRef.current();
          if (!token || cancelled) return;
          await BillingService.restore(token, workspaceId);
          if (cancelled) return;
          await refetchWorkspacesRef.current();
          if (!cancelled) setShowCheckStatus(false);
        } catch {
          // Keep paywall usable; offer a manual status check only on failure.
          if (!cancelled) setShowCheckStatus(true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [canManage]),
  );

  const isPremium = workspace?.plan === "premium";
  const showCheckoutProgress =
    !isPremium &&
    caps.purchaseMode === "checkout_url" &&
    (activating || checkoutStep != null);
  const progressStep: 1 | 2 | 3 | 4 = checkoutStep ?? 3;

  const clearCheckoutProgress = useCallback(async () => {
    if (workspace) {
      await AsyncStorage.removeItem(activatingKey(workspace.id));
    }
    setActivating(false);
    setCheckoutStep(null);
  }, [workspace]);

  const onRefreshStatus = useCallback(async () => {
    if (!workspace || !canManage) {
      await workspacesQuery.refetch();
      return;
    }
    setRefreshingStatus(true);
    try {
      const token = await getToken();
      if (token) {
        const synced = await BillingService.restore(token, workspace.id);
        if (synced.plan === "premium") {
          setCheckoutStep(4);
        } else {
          setCheckoutStep(3);
        }
        setShowCheckStatus(false);
      }
      await workspacesQuery.refetch();
    } catch {
      setShowCheckStatus(true);
      await workspacesQuery.refetch();
    } finally {
      setRefreshingStatus(false);
    }
  }, [canManage, getToken, workspace, workspacesQuery]);

  const onCheckout = async () => {
    if (!workspace || !canManage) return;
    // Open blank tab while still in the click gesture (web popup-blocker safe).
    const pendingCheckoutWindow =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.open("about:blank", "_blank")
        : null;
    setBusy(true);
    setPurchaseState("pending");
    setCheckoutStep(1);
    try {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      Analytics.track("checkout_started", { workspace_id: workspace.id });
      await AsyncStorage.setItem(activatingKey(workspace.id), "1");
      setActivating(true);
      const result = await BillingService.purchase(
        token,
        workspace.id,
        DEFAULT_PREMIUM_PRODUCT,
      );
      if (result.mode === "checkout") {
        setCheckoutStep(2);
        openStripeCheckoutUrl(result.url, pendingCheckoutWindow);
        // Same-tab redirect unloads this page; tab/popup path keeps waiting here.
        setCheckoutStep(3);
        setPurchaseState("verifying");
        try {
          const synced = await BillingService.restore(token, workspace.id);
          if (synced.plan === "premium") {
            setCheckoutStep(4);
            setPurchaseState("active");
          }
        } catch {
          // Stay on step 3; poll / Refresh may still activate.
        }
      } else {
        pendingCheckoutWindow?.close();
        setPurchaseState("verifying");
        setCheckoutStep(3);
        if (result.sync.plan === "premium") {
          setCheckoutStep(4);
          setPurchaseState("active");
        }
      }
      await workspacesQuery.refetch();
    } catch (error) {
      pendingCheckoutWindow?.close();
      setPurchaseState("failed");
      await clearCheckoutProgress();
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("billing.checkoutFailed");
      Alert.alert(t("billing.screenTitle"), message);
    } finally {
      setBusy(false);
      setPurchaseState((s) => (s === "pending" || s === "verifying" ? "idle" : s));
    }
  };

  const onCheckPremiumStatus = async () => {
    if (!workspace || !canManage) return;
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      const synced = await BillingService.restore(token, workspace.id);
      await workspacesQuery.refetch();
      setShowCheckStatus(false);
      if (synced.plan === "premium") {
        setPurchaseState("active");
        Alert.alert(t("billing.screenTitle"), t("billing.checkPremiumActive"));
      } else {
        Alert.alert(t("billing.screenTitle"), t("billing.checkPremiumNone"));
      }
    } catch (error) {
      setShowCheckStatus(true);
      const message =
        error instanceof Error ? error.message : t("billing.checkPremiumFailed");
      Alert.alert(t("billing.screenTitle"), message);
    } finally {
      setBusy(false);
      setPurchaseState("idle");
    }
  };

  const onPortal = async () => {
    if (!workspace || !canManage) return;
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      const result = await BillingService.manage(token, workspace.id);
      if ("url" in result) {
        await WebBrowser.openBrowserAsync(result.url);
      }
      try {
        await BillingService.restore(token, workspace.id);
      } catch {
        // Refetch still helps if webhook already landed.
      }
      await workspacesQuery.refetch();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("billing.portalFailed");
      Alert.alert(t("billing.screenTitle"), message);
    } finally {
      setBusy(false);
    }
  };

  const primaryProduct =
    storeProducts.find((p) => p.productId === DEFAULT_PREMIUM_PRODUCT) ??
    storeProducts[0];
  const displayPrice = useStorePrice
    ? primaryProduct?.displayPrice || null
    : (priceQuery.data?.formatted ?? null);
  const displayInterval = useStorePrice
    ? primaryProduct?.billingInterval ?? "month"
    : (priceQuery.data?.interval ?? null);
  const priceLoading = useStorePrice
    ? productsLoading
    : priceQuery.isPending;

  return (
    <Screen style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: spacing[2],
          paddingBottom: spacing[2],
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("auth.back")}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BackIcon size={20} />
        </Pressable>
        <Text
          style={{
            ...typography.headline,
            color: theme.text,
            flex: 1,
            textAlign: "center",
            marginRight: 44,
          }}
        >
          {t("billing.screenTitle")}
        </Text>
      </View>

      {!hydrated || workspacesQuery.isPending ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : !workspace ? (
        <View style={{ padding: spacing[5] }}>
          <Text style={{ ...typography.body, color: theme.textMuted }}>
            {t("billing.noWorkspace")}
          </Text>
        </View>
      ) : showCheckoutProgress ? (
        <PremiumCheckoutProgressView
          activeStep={progressStep}
          refreshing={refreshingStatus}
          onRefresh={() => void onRefreshStatus()}
          onCancel={() => {
            void clearCheckoutProgress().then(() => {
              if (router.canGoBack()) router.back();
            });
          }}
        />
      ) : isPremium ? (
        <PremiumActiveView
          billingStatus={workspace.billingStatus ?? "active"}
          currentPeriodEnd={workspace.currentPeriodEnd ?? null}
          canManage={canManage}
          busy={busy}
          onPortal={() => void onPortal()}
        />
      ) : (
        <PremiumPurchaseView
          busy={busy}
          canManage={canManage}
          onCheckout={() => void onCheckout()}
          onCheckStatus={() => void onCheckPremiumStatus()}
          showCheckStatus={showCheckStatus}
          supportsPurchase={caps.supportsPurchase}
          unavailableReason={BillingService.purchaseUnavailableReason()}
          showStripeHelper={caps.purchaseMode === "checkout_url"}
          showVerifyingPaymentCta={
            caps.purchaseMode === "native_iap" &&
            (purchaseState === "pending" || purchaseState === "verifying")
          }
          onOpenDebug={
            BillingService.isBillingDebugEnabled()
              ? () => router.push("/billing-debug" as never)
              : undefined
          }
          priceFormatted={displayPrice}
          priceInterval={displayInterval}
          priceLoading={priceLoading}
        />
      )}
    </Screen>
  );
}
