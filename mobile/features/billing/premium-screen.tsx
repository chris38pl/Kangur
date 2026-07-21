import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

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
import { BackIcon, LockFieldIcon } from "@/features/auth/auth-icons";
import {
  createBillingCheckout,
  createBillingPortal,
  syncBillingEntitlement,
} from "@/features/billing/api";
import { usePremiumPrice } from "@/features/billing/usePremiumPrice";
import {
  ProfileIconList,
  ProfileIconShield,
  ProfileIconStar,
} from "@/features/profile/profile-icons";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { ApiClientError } from "@/lib/api/client";

const activatingKey = (workspaceId: string) =>
  `kangur.billing.activating.${workspaceId}`;

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
  priceFormatted,
  priceInterval,
  priceLoading,
}: {
  busy: boolean;
  canManage: boolean;
  onCheckout: () => void;
  priceFormatted: string | null;
  priceInterval: "day" | "week" | "month" | "year" | null;
  priceLoading: boolean;
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

        <View style={{ width: "100%", gap: spacing[4], marginBottom: spacing[4] }}>
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

        {canManage ? (
          <Pressable
            onPress={onCheckout}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t("billing.tryFreeCta")}
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
                {t("billing.tryFreeCta")}
              </Text>
            )}
          </Pressable>
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
  const priceQuery = usePremiumPrice();
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

  useEffect(() => {
    if (!workspace) return;
    void AsyncStorage.getItem(activatingKey(workspace.id)).then((v) => {
      if (v === "1") {
        setActivating(true);
        setCheckoutStep((current) => current ?? 3);
      }
    });
  }, [workspace?.id]);

  if (workspace?.plan === "premium" && activating) {
    setActivating(false);
    setCheckoutStep(null);
  }

  useEffect(() => {
    if (!workspace || workspace.plan !== "premium") return;
    void AsyncStorage.removeItem(activatingKey(workspace.id));
  }, [workspace?.id, workspace?.plan]);

  // After Checkout, webhooks may be delayed (or missing locally). Sync from Stripe
  // and poll until plan flips to premium.
  useEffect(() => {
    if (!workspace?.id || !activating || workspace.plan === "premium") return;
    if (!canManage) return;

    const workspaceId = workspace.id;
    let cancelled = false;

    const pull = async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        // Stay on step 3 (payment confirmation) until Stripe entitlement is Premium.
        setCheckoutStep((s) => (s == null || s < 3 ? 3 : s === 4 ? 4 : 3));
        const synced = await syncBillingEntitlement(token, workspaceId);
        if (cancelled) return;
        if (synced.plan === "premium") {
          setCheckoutStep(4);
        }
        await workspacesQuery.refetch();
      } catch {
        // Keep progress UI; user can Refresh / cancel.
      }
    };

    void pull();
    const interval = setInterval(() => {
      void pull();
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    activating,
    canManage,
    getToken,
    workspace?.id,
    workspace?.plan,
    workspacesQuery.refetch,
  ]);

  const workspaceIdRef = useRef(workspace?.id);
  const planRef = useRef(workspace?.plan);
  workspaceIdRef.current = workspace?.id;
  planRef.current = workspace?.plan;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        await workspacesQuery.refetch();
        const workspaceId = workspaceIdRef.current;
        if (!workspaceId || !canManage || planRef.current !== "premium") {
          return;
        }
        try {
          const token = await getToken();
          if (!token || cancelled) return;
          await syncBillingEntitlement(token, workspaceId);
          if (!cancelled) {
            await workspacesQuery.refetch();
          }
        } catch {
          // Non-blocking - UI still shows last known entitlement.
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [canManage, getToken, workspacesQuery.refetch]),
  );

  const isPremium = workspace?.plan === "premium";
  const showCheckoutProgress =
    !isPremium && (activating || checkoutStep != null);
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
        const synced = await syncBillingEntitlement(token, workspace.id);
        if (synced.plan === "premium") {
          setCheckoutStep(4);
        } else {
          setCheckoutStep(3);
        }
      }
      await workspacesQuery.refetch();
    } catch {
      await workspacesQuery.refetch();
    } finally {
      setRefreshingStatus(false);
    }
  }, [canManage, getToken, workspace, workspacesQuery]);

  const onCheckout = async () => {
    if (!workspace || !canManage) return;
    setBusy(true);
    setCheckoutStep(1);
    try {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      await AsyncStorage.setItem(activatingKey(workspace.id), "1");
      setActivating(true);
      const { url } = await createBillingCheckout(token, workspace.id);
      // Step 2 while Stripe Checkout is open - do not advance past this yet.
      setCheckoutStep(2);
      await WebBrowser.openBrowserAsync(url);
      // Browser closed: wait for real payment confirmation (card + confirm).
      setCheckoutStep(3);
      try {
        const synced = await syncBillingEntitlement(token, workspace.id);
        if (synced.plan === "premium") {
          setCheckoutStep(4);
        }
      } catch {
        // Stay on step 3; poll / Refresh may still activate.
      }
      await workspacesQuery.refetch();
    } catch (error) {
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
    }
  };

  const onPortal = async () => {
    if (!workspace || !canManage) return;
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      const { url } = await createBillingPortal(token, workspace.id);
      await WebBrowser.openBrowserAsync(url);
      // Portal may set cancel_at_period_end - pull Stripe (webhooks alone are not enough locally).
      try {
        await syncBillingEntitlement(token, workspace.id);
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
          priceFormatted={priceQuery.data?.formatted ?? null}
          priceInterval={priceQuery.data?.interval ?? null}
          priceLoading={priceQuery.isPending}
        />
      )}
    </Screen>
  );
}
