import * as Clipboard from "expo-clipboard";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { BillingProduct } from "@shared/billing";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brand, colors, radius, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { BillingService } from "@/features/billing/billing-service";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";

/**
 * Internal Billing Debug — ENABLE_BILLING_DEBUG / preview / development.
 */
export function BillingDebugScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const router = useRouter();
  const { getToken } = useAuth();
  const workspacesQuery = useWorkspaces();
  const { activeWorkspace } = useActiveWorkspace(workspacesQuery.data);

  const [products, setProducts] = useState<BillingProduct[]>([]);
  const [busy, setBusy] = useState(false);
  const decision = BillingService.decisionTree();
  const caps = BillingService.capabilities();
  const meta = BillingService.cacheMeta();

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      await BillingService.initialize();
      const token = await getToken();
      const list = await BillingService.availableProducts({
        authToken: token,
        workspaceId: activeWorkspace?.id,
      });
      setProducts(list);
    } finally {
      setBusy(false);
    }
  }, [activeWorkspace?.id, getToken]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        if (cancelled) return;
        setBusy(true);
        try {
          await BillingService.initialize();
          if (cancelled) return;
          const token = await getToken();
          const list = await BillingService.availableProducts({
            authToken: token,
            workspaceId: activeWorkspace?.id,
          });
          if (!cancelled) setProducts(list);
        } finally {
          if (!cancelled) setBusy(false);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeWorkspace?.id, getToken]);

  if (!BillingService.isBillingDebugEnabled()) {
    return (
      <Screen style={{ backgroundColor: theme.bg, padding: spacing[5] }}>
        <Text style={{ ...typography.body, color: theme.textMuted }}>
          {t("billing.debugDisabled")}
        </Text>
      </Screen>
    );
  }

  const exportDiagnostics = async () => {
    const text = BillingService.exportDiagnostics({
      products,
      entitlement: activeWorkspace
        ? {
            plan: activeWorkspace.plan,
            status: activeWorkspace.billingStatus,
            currentPeriodEnd: activeWorkspace.currentPeriodEnd,
          }
        : null,
    });
    await Clipboard.setStringAsync(text);
    Alert.alert(t("billing.debugExported"));
  };

  const forceRefresh = async () => {
    setBusy(true);
    try {
      const token = await getToken();
      const list = await BillingService.forceRefreshProducts(token);
      setProducts(list);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: spacing[2],
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
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
          {t("billing.debugTitle")}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}>
        <Section title={t("billing.debugDecisionTree")} theme={theme}>
          <Mono theme={theme}>{decision.why}</Mono>
          <Mono theme={theme}>
            Platform={decision.platform} Channel={decision.channel} Provider=
            {decision.providerId}
          </Mono>
        </Section>

        <Section title={t("billing.debugCapabilities")} theme={theme}>
          <Mono theme={theme}>{JSON.stringify(caps, null, 2)}</Mono>
        </Section>

        <Section title={t("billing.debugCache")} theme={theme}>
          <Mono theme={theme}>
            source={meta.source}
            {"\n"}lastSuccessful={meta.lastSuccessfulRefreshAt ?? "null"}
            {"\n"}lastAttempt={meta.lastAttemptAt ?? "null"}
          </Mono>
        </Section>

        <Section title={t("billing.debugProducts")} theme={theme}>
          {busy ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            products.map((p) => (
              <Mono key={p.productId} theme={theme}>
                {p.productId} | {p.displayPrice || "—"} | avail={String(p.isAvailable)}{" "}
                | {p.source}
              </Mono>
            ))
          )}
        </Section>

        <Section title={t("billing.debugEntitlement")} theme={theme}>
          <Mono theme={theme}>
            {activeWorkspace
              ? JSON.stringify(
                  {
                    plan: activeWorkspace.plan,
                    status: activeWorkspace.billingStatus,
                    periodEnd: activeWorkspace.currentPeriodEnd,
                  },
                  null,
                  2,
                )
              : "none"}
          </Mono>
        </Section>

        <Pressable
          onPress={() => void forceRefresh()}
          style={btn(theme)}
        >
          <Text style={btnText}>{t("billing.debugRefreshProducts")}</Text>
        </Pressable>
        <Pressable onPress={() => void exportDiagnostics()} style={btn(theme)}>
          <Text style={btnText}>{t("billing.debugExport")}</Text>
        </Pressable>
        <Pressable
          onPress={() => void reload()}
          style={[btn(theme), { backgroundColor: brand.primary }]}
        >
          <Text style={[btnText, { color: "#fff" }]}>{t("billing.refresh")}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Section({
  title,
  theme,
  children,
}: {
  title: string;
  theme: (typeof colors)["light"];
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: spacing[2] }}>
      <Text style={{ ...typography.label, color: theme.text }}>{title}</Text>
      <View
        style={{
          backgroundColor: theme.surface ?? theme.bg,
          borderRadius: radius.md,
          padding: spacing[3],
          borderWidth: 1,
          borderColor: theme.border,
          gap: spacing[1],
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Mono({
  theme,
  children,
}: {
  theme: (typeof colors)["light"];
  children: React.ReactNode;
}) {
  return (
    <Text
      style={{
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 18,
        color: theme.textBody,
      }}
    >
      {children}
    </Text>
  );
}

function btn(theme: (typeof colors)["light"]) {
  return {
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: theme.border,
  };
}

const btnText = {
  ...typography.label,
  fontSize: 15,
};
