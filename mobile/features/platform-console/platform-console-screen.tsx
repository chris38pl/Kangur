import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { useMe } from "@/features/auth/useMe";
import { apiFetch } from "@/lib/api/client";

import {
  getMetricHistory,
  recordOverviewSample,
  recordRealtimeSample,
  type MetricHistoryKey,
} from "./metric-history";
import { RealtimePanel, type RealtimeData } from "./realtime-panel";
import { Sparkline } from "./sparkline";

/** Soft tint for icon wells (~12–16% opacity). */
function softTint(hex: string, alphaHex = "28"): string {
  if (hex.startsWith("#") && (hex.length === 7 || hex.length === 4)) {
    return `${hex}${alphaHex}`;
  }
  return hex;
}

const OverviewSchema = z.object({
  platformStatus: z.enum(["healthy", "warning", "critical"]),
  activeAlertCount: z.number(),
  activeSessions: z.number().nullable(),
  rps: z.number().nullable(),
  p95Ms: z.number().nullable(),
  headroom: z.number().nullable(),
  pollingOk: z.boolean().nullable(),
});

const RealtimeSchema = z.object({
  systemStatus: z.enum(["healthy", "warning", "degraded"]),
  autoRefreshSec: z.number(),
  polling: z.object({
    activePollers: z.number().nullable(),
    pollRequestsPerSec: z.number().nullable(),
    p50Ms: z.number().nullable(),
    p95Ms: z.number().nullable(),
    emptyPollRatio: z.number().nullable(),
    failuresPerSec: z.number().nullable(),
    timeoutsPerSec: z.number().nullable(),
    lastErrorAgeSec: z.number().nullable(),
    lastErrorKind: z.string().nullable(),
    intervalDistribution: z.object({
      available: z.boolean(),
      hotShare: z.number().nullable(),
      warmShare: z.number().nullable(),
      coldShare: z.number().nullable(),
      hotCount: z.number().nullable(),
      warmCount: z.number().nullable(),
      coldCount: z.number().nullable(),
    }),
  }),
  events: z.object({
    eventsPerSec: z.number().nullable(),
    eventsPerResponse: z.number().nullable(),
    drainCapHits: z.number().nullable(),
    seedingBatches: z.number().nullable(),
    pollNowCount: z.number().nullable(),
  }),
  refresh: z.object({
    requests: z.number().nullable(),
    deferred: z.number().nullable(),
    offlineCancelled: z.number().nullable(),
    avgDelayMs: z.number().nullable(),
  }),
  sync: z.object({
    pendingQueue: z.number().nullable(),
    successRate: z.number().nullable(),
    retryCount: z.number().nullable(),
    failedOps: z.number().nullable(),
  }),
});

type Overview = z.infer<typeof OverviewSchema>;

type ConsoleSection = "overview" | "realtime";

type HealthLevel = "healthy" | "warning" | "critical";

type DisplayAlert = {
  id: string;
  titleKey: string;
  detailKey: string;
  detailParams?: Record<string, string | number>;
  value: string;
  severity: "warning" | "critical";
};

const SECTIONS: { id: ConsoleSection; labelKey: string }[] = [
  { id: "overview", labelKey: "platformConsole.sectionOverview" },
  { id: "realtime", labelKey: "platformConsole.sectionRealtime" },
];

const LATENCY_ACCENT = "#7C6CF0";

/**
 * Presentation-only health: overall platform impact, not a single SLO blip.
 * Does not change API data — only how Overview answers “is the platform OK?”
 */
function deriveDisplayHealth(overview: Overview | undefined): {
  level: HealthLevel;
  alerts: DisplayAlert[];
} {
  const alerts: DisplayAlert[] = [];
  if (!overview) {
    return { level: "healthy", alerts };
  }

  const p95 = overview.p95Ms;
  const headroom = overview.headroom;

  if (p95 != null && p95 > 250) {
    alerts.push({
      id: "p95",
      titleKey: "platformConsole.alertP95Title",
      detailKey: "platformConsole.alertP95Detail",
      detailParams: { threshold: 250 },
      value: `${Math.round(p95)} ms`,
      severity: p95 > 500 ? "critical" : "warning",
    });
  }

  if (headroom != null && headroom < 5) {
    alerts.push({
      id: "headroom",
      titleKey: "platformConsole.alertHeadroomTitle",
      detailKey: "platformConsole.alertHeadroomDetail",
      value: `${formatHeadroom(headroom)}×`,
      severity: headroom < 2 ? "critical" : "warning",
    });
  }

  if (overview.pollingOk === false) {
    alerts.push({
      id: "polling",
      titleKey: "platformConsole.alertPollingTitle",
      detailKey: "platformConsole.alertPollingDetail",
      value: "—",
      severity: "warning",
    });
  }

  const hasCritical =
    (headroom != null && headroom < 2) ||
    (p95 != null && p95 > 1000) ||
    alerts.filter((a) => a.severity === "critical").length >= 2;

  if (hasCritical) {
    return { level: "critical", alerts };
  }
  if (alerts.length > 0) {
    return { level: "warning", alerts };
  }
  return { level: "healthy", alerts };
}

function formatHeadroom(n: number): string {
  if (n >= 100) return String(Math.round(n));
  if (n >= 10) return n.toFixed(0);
  return n.toFixed(1);
}

function headroomQualitative(
  n: number | null | undefined,
  t: (k: string) => string,
): string | null {
  if (n == null) return null;
  if (n >= 20) return t("platformConsole.qualExcellent");
  if (n >= 5) return t("platformConsole.qualGood");
  if (n >= 2) return t("platformConsole.qualTight");
  return t("platformConsole.qualCritical");
}

function p95Qualitative(
  ms: number | null | undefined,
  t: (k: string) => string,
): string | null {
  if (ms == null) return null;
  if (ms < 100) return t("platformConsole.qualExcellent");
  if (ms < 250) return t("platformConsole.qualGood");
  if (ms < 500) return t("platformConsole.qualElevated");
  return t("platformConsole.qualHigh");
}

function healthColors(level: HealthLevel, theme: (typeof colors)["light"]) {
  if (level === "healthy") {
    return { accent: theme.success, soft: softTint(theme.success, "26") };
  }
  if (level === "warning") {
    return { accent: theme.warning, soft: softTint(theme.warning, "2E") };
  }
  return { accent: theme.danger, soft: softTint(theme.danger, "2E") };
}

function HealthStatusIcon({
  level,
  accent,
  soft,
}: {
  level: HealthLevel;
  accent: string;
  soft: string;
}) {
  const size = 72;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: soft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {level === "healthy" ? (
        <View
          style={{
            width: 36,
            height: 40,
            borderRadius: 10,
            borderWidth: 2.5,
            borderColor: accent,
            backgroundColor: softTint(accent, "33"),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: accent, fontSize: 20, fontWeight: "800" }}>
            ✓
          </Text>
        </View>
      ) : (
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 20,
            borderRightWidth: 20,
            borderBottomWidth: 34,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "900",
              position: "absolute",
              top: 14,
              left: -4,
            }}
          >
            !
          </Text>
        </View>
      )}
    </View>
  );
}

function MetricIconWell({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: softTint(color, "22"),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  );
}

function MarkPeople({ color }: { color: string }) {
  return (
    <MetricIconWell color={color}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              borderWidth: 1.5,
              borderColor: color,
              marginBottom: 2,
            }}
          />
          <View
            style={{
              width: 12,
              height: 7,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              borderWidth: 1.5,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
        </View>
        <View style={{ alignItems: "center", marginBottom: 1 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              borderWidth: 1.5,
              borderColor: color,
              marginBottom: 2,
            }}
          />
          <View
            style={{
              width: 9,
              height: 5,
              borderTopLeftRadius: 5,
              borderTopRightRadius: 5,
              borderWidth: 1.5,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
        </View>
      </View>
    </MetricIconWell>
  );
}

function MarkBolt({ color }: { color: string }) {
  return (
    <MetricIconWell color={color}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 7,
          borderRightWidth: 7,
          borderBottomWidth: 16,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
          transform: [{ rotate: "12deg" }],
        }}
      />
    </MetricIconWell>
  );
}

function MarkClock({ color }: { color: string }) {
  return (
    <MetricIconWell color={color}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: 2,
            height: 6,
            backgroundColor: color,
            top: 3,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 5,
            height: 2,
            backgroundColor: color,
            left: 9,
            top: 9,
            borderRadius: 1,
          }}
        />
      </View>
    </MetricIconWell>
  );
}

function MarkGauge({ color }: { color: string }) {
  return (
    <MetricIconWell color={color}>
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 22,
            height: 11,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderWidth: 2,
            borderBottomWidth: 0,
            borderColor: color,
          }}
        />
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: color,
            marginTop: -2,
          }}
        />
      </View>
    </MetricIconWell>
  );
}

function SegmentedControl({
  value,
  onChange,
}: {
  value: ConsoleSection;
  onChange: (id: ConsoleSection) => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        marginHorizontal: spacing[4],
        marginBottom: spacing[4],
        padding: 3,
        borderRadius: radius.md,
        backgroundColor: theme.border,
        flexDirection: "row",
      }}
    >
      {SECTIONS.map((s) => {
        const active = value === s.id;
        return (
          <Pressable
            key={s.id}
            onPress={() => onChange(s.id)}
            style={{
              flex: 1,
              paddingVertical: spacing[2],
              borderRadius: radius.sm,
              backgroundColor: active ? theme.surface : "transparent",
              alignItems: "center",
              justifyContent: "center",
              ...(active
                ? {
                    shadowColor: "#1B2C3B",
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 2,
                  }
                : null),
            }}
          >
            <Text
              style={{
                fontSize: 11,
                lineHeight: 14,
                fontWeight: active ? "700" : "500",
                color: active ? theme.text : theme.textMuted,
              }}
              numberOfLines={1}
            >
              {t(s.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HealthCard({
  level,
  alertCount,
  loading,
}: {
  level: HealthLevel;
  alertCount: number;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const tone = healthColors(level, theme);

  const title =
    level === "healthy"
      ? t("platformConsole.statusHealthy")
      : level === "warning"
        ? t("platformConsole.statusWarning")
        : t("platformConsole.statusCritical");

  const statusLine =
    level === "healthy"
      ? t("platformConsole.healthSubtitleHealthy")
      : alertCount > 0
        ? t("platformConsole.activeWarnings", { count: alertCount })
        : t("platformConsole.healthSubtitleCritical");

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.border,
        padding: spacing[4],
        marginBottom: spacing[4],
      }}
    >
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[4],
          }}
        >
          <HealthStatusIcon
            level={level}
            accent={tone.accent}
            soft={tone.soft}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                fontWeight: "600",
                marginBottom: 2,
              }}
            >
              {t("platformConsole.platformHealth")}
            </Text>
            <Text
              style={{
                fontSize: 26,
                lineHeight: 32,
                fontWeight: "700",
                color: tone.accent,
              }}
            >
              {title}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: spacing[2],
                gap: spacing[2],
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: tone.accent,
                }}
              />
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  flex: 1,
                }}
                numberOfLines={2}
              >
                {statusLine}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function KpiTile({
  icon,
  title,
  value,
  subtitle,
  qualitative,
  accent,
  historyKey,
  emptyTrendLabel,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
  qualitative?: string | null;
  accent: string;
  historyKey: MetricHistoryKey;
  emptyTrendLabel: string;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const sparkValues = getMetricHistory(historyKey);

  return (
    <View
      style={{
        flex: 1,
        minWidth: "47%",
        backgroundColor: theme.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        padding: spacing[3],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: spacing[3],
          marginBottom: spacing[3],
        }}
      >
        {icon}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              fontWeight: "600",
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {qualitative ? (
            <Text
              style={{
                ...typography.caption,
                color: accent,
                fontWeight: "700",
                marginTop: 1,
              }}
              numberOfLines={1}
            >
              {qualitative}
            </Text>
          ) : null}
          <Text
            style={{
              fontSize: 24,
              lineHeight: 30,
              fontWeight: "700",
              color: theme.text,
              marginTop: qualitative ? 0 : 2,
            }}
            numberOfLines={1}
          >
            {value}
          </Text>
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              marginTop: 1,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
      </View>
      <Sparkline
        values={sparkValues}
        color={accent}
        emptyLabel={emptyTrendLabel}
      />
    </View>
  );
}

function AlertsSection({ alerts }: { alerts: DisplayAlert[] }) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  if (alerts.length === 0) return null;

  return (
    <View style={{ marginBottom: spacing[4] }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: spacing[3],
          gap: spacing[2],
        }}
      >
        <Text style={{ ...typography.headline, color: theme.text }}>
          {t("platformConsole.activeAlertsHeading")}
        </Text>
        <View
          style={{
            minWidth: 22,
            height: 22,
            borderRadius: 11,
            paddingHorizontal: 6,
            backgroundColor: theme.warning,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            {alerts.length}
          </Text>
        </View>
      </View>
      {alerts.map((alert) => {
        const accent =
          alert.severity === "critical" ? theme.danger : theme.warning;
        return (
          <View
            key={alert.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: theme.border,
              padding: spacing[3],
              marginBottom: spacing[2],
              gap: spacing[3],
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: accent + "33",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: accent }}>
                !
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  ...typography.label,
                  color: theme.text,
                }}
                numberOfLines={2}
              >
                {t(alert.titleKey)}
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {t(alert.detailKey, alert.detailParams)}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  ...typography.label,
                  color: theme.text,
                }}
              >
                {alert.value}
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  marginTop: 2,
                }}
              >
                {t("platformConsole.justNow")}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function OverviewBody({
  overview,
  loading,
}: {
  overview: Overview | undefined;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const { level, alerts } = deriveDisplayHealth(overview);
  const noTrend = t("platformConsole.noTrendYet");

  const sessions =
    overview?.activeSessions != null ? String(overview.activeSessions) : "—";
  const rps = overview?.rps != null ? String(overview.rps) : "—";
  const p95 =
    overview?.p95Ms != null ? `${Math.round(overview.p95Ms)} ms` : "—";
  const headroom =
    overview?.headroom != null
      ? `${formatHeadroom(overview.headroom)}×`
      : "—";

  return (
    <>
      <HealthCard
        level={level}
        alertCount={alerts.length}
        loading={loading}
      />
      <AlertsSection alerts={alerts} />

      <Text
        style={{
          ...typography.headline,
          color: theme.text,
          marginBottom: spacing[3],
        }}
      >
        {t("platformConsole.keyMetrics")}
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing[3],
          marginBottom: spacing[4],
        }}
      >
        <KpiTile
          icon={<MarkPeople color={theme.success} />}
          title={t("platformConsole.metricSessions")}
          value={sessions}
          subtitle={t("platformConsole.metricSessionsHint")}
          accent={theme.success}
          historyKey="activeSessions"
          emptyTrendLabel={noTrend}
        />
        <KpiTile
          icon={<MarkBolt color={theme.success} />}
          title={t("platformConsole.metricRps")}
          value={rps}
          subtitle={t("platformConsole.metricRpsHint")}
          accent={theme.success}
          historyKey="rps"
          emptyTrendLabel={noTrend}
        />
        <KpiTile
          icon={<MarkClock color={LATENCY_ACCENT} />}
          title={t("platformConsole.metricP95")}
          value={p95}
          subtitle={t("platformConsole.metricP95Hint")}
          qualitative={p95Qualitative(overview?.p95Ms, t)}
          accent={LATENCY_ACCENT}
          historyKey="p95Ms"
          emptyTrendLabel={noTrend}
        />
        <KpiTile
          icon={<MarkGauge color={theme.success} />}
          title={t("platformConsole.metricHeadroom")}
          value={headroom}
          subtitle={t("platformConsole.metricHeadroomHint")}
          qualitative={headroomQualitative(overview?.headroom, t)}
          accent={theme.success}
          historyKey="headroom"
          emptyTrendLabel={noTrend}
        />
      </View>

      <Text
        style={{
          ...typography.caption,
          color: theme.textMuted,
          textAlign: "center",
        }}
      >
        {t("platformConsole.metricsNote")}
      </Text>
    </>
  );
}

export function PlatformConsoleScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getToken } = useAuth();
  const { data: me, isLoading: meLoading } = useMe();
  const [section, setSection] = useState<ConsoleSection>("overview");

  const isAdmin = me?.platformRole === "ADMIN";

  const overviewQuery = useQuery({
    queryKey: ["platform", "overview"],
    enabled: isAdmin,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing token");
      const data = await apiFetch<unknown>("/api/v1/platform/overview", {
        token,
      });
      const overview = OverviewSchema.parse(data);
      // Rolling sparkline buffers — real poll samples only, no fabricated history.
      recordOverviewSample({
        activeSessions: overview.activeSessions,
        rps: overview.rps,
        p95Ms: overview.p95Ms,
        headroom: overview.headroom,
      });
      return overview;
    },
    refetchInterval: 30_000,
  });

  const realtimeQuery = useQuery({
    queryKey: ["platform", "realtime"],
    enabled: isAdmin && section === "realtime",
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing token");
      const data = await apiFetch<unknown>("/api/v1/platform/realtime", {
        token,
      });
      const realtime = RealtimeSchema.parse(data) as RealtimeData;
      recordRealtimeSample({
        "rt.activePollers": realtime.polling.activePollers,
        "rt.pollRps": realtime.polling.pollRequestsPerSec,
        "rt.p50Ms": realtime.polling.p50Ms,
        "rt.p95Ms": realtime.polling.p95Ms,
        "rt.emptyRatio":
          realtime.polling.emptyPollRatio != null
            ? realtime.polling.emptyPollRatio * 100
            : null,
        "rt.failures": realtime.polling.failuresPerSec,
        "rt.timeouts": realtime.polling.timeoutsPerSec,
        "rt.eventsPerSec": realtime.events.eventsPerSec,
        "rt.eventsPerResponse": realtime.events.eventsPerResponse,
      });
      return realtime;
    },
    refetchInterval: 15_000,
  });

  if (meLoading) {
    return (
      <Screen edges={["top"]} style={{ backgroundColor: theme.section }}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={theme.primary} />
        </View>
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen edges={["top"]} style={{ backgroundColor: theme.section }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing[2],
            minHeight: 52,
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
            <BackIcon color={theme.text} size={22} />
          </Pressable>
        </View>
        <View style={{ padding: spacing[6] }}>
          <Text style={{ ...typography.title, color: theme.text }}>
            {t("platformConsole.forbiddenTitle")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textMuted,
              marginTop: spacing[2],
            }}
          >
            {t("platformConsole.forbiddenBody")}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.section }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing[2],
          paddingBottom: spacing[2],
          minHeight: 52,
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
          <BackIcon color={theme.primary} size={22} />
        </Pressable>
        <Text
          style={{
            ...typography.headline,
            color: theme.text,
            flex: 1,
            marginRight: 44,
            textAlign: "center",
            fontWeight: "700",
          }}
          numberOfLines={1}
        >
          {t("platformConsole.title")}
        </Text>
      </View>

      <SegmentedControl value={section} onChange={setSection} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[4],
          paddingBottom: insets.bottom + spacing[8],
        }}
        showsVerticalScrollIndicator={false}
      >
        {section === "overview" ? (
          <OverviewBody
            overview={overviewQuery.data}
            loading={overviewQuery.isLoading}
          />
        ) : (
          <RealtimePanel
            data={realtimeQuery.data}
            loading={realtimeQuery.isLoading}
          />
        )}
      </ScrollView>
    </Screen>
  );
}
