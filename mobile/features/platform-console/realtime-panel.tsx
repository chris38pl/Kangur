import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

import {
  getMetricHistory,
  type MetricHistoryKey,
} from "./metric-history";
import { Sparkline } from "./sparkline";

export type RealtimeTab = "polling" | "events" | "refresh" | "sync";

export type RealtimeData = {
  systemStatus: "healthy" | "warning" | "degraded";
  autoRefreshSec: number;
  polling: {
    activePollers: number | null;
    pollRequestsPerSec: number | null;
    p50Ms: number | null;
    p95Ms: number | null;
    emptyPollRatio: number | null;
    failuresPerSec: number | null;
    timeoutsPerSec: number | null;
    lastErrorAgeSec: number | null;
    lastErrorKind: string | null;
    intervalDistribution: {
      available: boolean;
      hotShare: number | null;
      warmShare: number | null;
      coldShare: number | null;
      hotCount: number | null;
      warmCount: number | null;
      coldCount: number | null;
    };
  };
  events: {
    eventsPerSec: number | null;
    eventsPerResponse: number | null;
    drainCapHits: number | null;
    seedingBatches: number | null;
    pollNowCount: number | null;
  };
  refresh: {
    requests: number | null;
    deferred: number | null;
    offlineCancelled: number | null;
    avgDelayMs: number | null;
  };
  sync: {
    pendingQueue: number | null;
    successRate: number | null;
    retryCount: number | null;
    failedOps: number | null;
  };
};

const ACCENT = {
  green: "#2F9E71",
  blue: "#3B82F6",
  purple: "#7C6CF0",
  orange: "#F59E0B",
  red: "#E05A5A",
} as const;

const TABS: { id: RealtimeTab; labelKey: string }[] = [
  { id: "polling", labelKey: "platformConsole.rtTabPolling" },
  { id: "events", labelKey: "platformConsole.rtTabEvents" },
  { id: "refresh", labelKey: "platformConsole.rtTabRefresh" },
  { id: "sync", labelKey: "platformConsole.rtTabSync" },
];

function softTint(hex: string, alphaHex = "22"): string {
  if (hex.startsWith("#") && hex.length === 7) return `${hex}${alphaHex}`;
  return hex;
}

function fmtNum(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "-";
  if (Number.isInteger(n) || digits === 0) return String(Math.round(n));
  return n.toFixed(digits);
}

function fmtPct(ratio: number | null | undefined): string {
  if (ratio == null || !Number.isFinite(ratio)) return "-";
  return `${Math.round(ratio * 100)}%`;
}

function fmtMs(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "-";
  return `${Math.round(n)} ms`;
}

function MiniKpi({
  title,
  value,
  hint,
  accent,
  historyKey,
  emptyTrend,
}: {
  title: string;
  value: string;
  hint?: string;
  accent: string;
  historyKey?: MetricHistoryKey;
  emptyTrend: string;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const spark = historyKey ? getMetricHistory(historyKey) : [];

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
      <Text
        style={{
          ...typography.caption,
          color: theme.textMuted,
          fontWeight: "600",
        }}
        numberOfLines={2}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 22,
          lineHeight: 28,
          fontWeight: "700",
          color: theme.text,
          marginTop: 4,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
      {hint ? (
        <Text
          style={{
            ...typography.caption,
            color: accent,
            fontWeight: "600",
            marginTop: 2,
            fontSize: 11,
          }}
          numberOfLines={1}
        >
          {hint}
        </Text>
      ) : null}
      <View style={{ marginTop: spacing[2] }}>
        {historyKey ? (
          <Sparkline
            values={spark}
            color={accent}
            height={28}
            emptyLabel={emptyTrend}
          />
        ) : (
          <View style={{ height: 28, justifyContent: "center" }}>
            <View
              style={{ height: 1, backgroundColor: theme.border, width: "100%" }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function IntervalDistribution({
  dist,
}: {
  dist: RealtimeData["polling"]["intervalDistribution"];
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  if (!dist.available) {
    return (
      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.border,
          padding: spacing[4],
          marginBottom: spacing[4],
        }}
      >
        <Text style={{ ...typography.label, color: theme.text }}>
          {t("platformConsole.rtIntervalDist")}
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: theme.textMuted,
            marginTop: spacing[2],
          }}
        >
          {t("platformConsole.rtIntervalPending")}
        </Text>
      </View>
    );
  }

  const hot = dist.hotShare ?? 0;
  const warm = dist.warmShare ?? 0;
  const cold = dist.coldShare ?? 0;
  const total = hot + warm + cold || 1;

  const rows = [
    {
      key: "hot",
      label: t("platformConsole.rtTierHot"),
      share: hot,
      count: dist.hotCount,
      color: ACCENT.green,
    },
    {
      key: "warm",
      label: t("platformConsole.rtTierWarm"),
      share: warm,
      count: dist.warmCount,
      color: ACCENT.blue,
    },
    {
      key: "cold",
      label: t("platformConsole.rtTierCold"),
      share: cold,
      count: dist.coldCount,
      color: ACCENT.purple,
    },
  ];

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        padding: spacing[4],
        marginBottom: spacing[4],
      }}
    >
      <Text style={{ ...typography.label, color: theme.text, marginBottom: spacing[3] }}>
        {t("platformConsole.rtIntervalDist")}
      </Text>
      <View
        style={{
          flexDirection: "row",
          height: 12,
          borderRadius: 6,
          overflow: "hidden",
          marginBottom: spacing[4],
        }}
      >
        {rows.map((r) => (
          <View
            key={r.key}
            style={{
              flex: Math.max(0.001, r.share / total),
              backgroundColor: r.color,
            }}
          />
        ))}
      </View>
      {rows.map((r) => (
        <View
          key={r.key}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: spacing[2],
            gap: spacing[2],
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: r.color,
            }}
          />
          <Text style={{ ...typography.caption, color: theme.text, flex: 1 }}>
            {r.label}
          </Text>
          <Text style={{ ...typography.caption, color: theme.textMuted }}>
            {Math.round((r.share / total) * 100)}%
            {r.count != null ? ` (${r.count})` : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SystemStatusBanner({
  status,
}: {
  status: RealtimeData["systemStatus"];
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const accent =
    status === "healthy"
      ? theme.success
      : status === "warning"
        ? theme.warning
        : theme.danger;

  const title = t("platformConsole.rtSystemStatus");
  const body =
    status === "healthy"
      ? t("platformConsole.rtSystemHealthy")
      : status === "warning"
        ? t("platformConsole.rtSystemWarning")
        : t("platformConsole.rtSystemDegraded");

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        backgroundColor: theme.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        padding: spacing[3],
        marginTop: spacing[2],
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: softTint(accent, "28"),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: accent, fontWeight: "800", fontSize: 16 }}>
          {status === "healthy" ? "✓" : "!"}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ ...typography.label, color: theme.text }}>{title}</Text>
        <Text
          style={{ ...typography.caption, color: theme.textMuted, marginTop: 2 }}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}

function PlaceholderNote() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  return (
    <Text
      style={{
        ...typography.caption,
        color: theme.textMuted,
        textAlign: "center",
        marginTop: spacing[2],
        marginBottom: spacing[3],
      }}
    >
      {t("platformConsole.rtClientMetricsPending")}
    </Text>
  );
}

export function RealtimePanel({
  data,
  loading,
}: {
  data: RealtimeData | undefined;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const [tab, setTab] = useState<RealtimeTab>("polling");
  const emptyTrend = t("platformConsole.noTrendYet");

  if (loading && !data) {
    return (
      <View style={{ paddingVertical: spacing[10], alignItems: "center" }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const p = data?.polling;
  const e = data?.events;
  const r = data?.refresh;
  const s = data?.sync;

  return (
    <View>
      <Text style={{ ...typography.title, color: theme.text, fontSize: 28 }}>
        {t("platformConsole.sectionRealtime")}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[4],
          marginTop: spacing[2],
          marginBottom: spacing[4],
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.success,
            }}
          />
          <Text style={{ ...typography.caption, color: theme.textMuted }}>
            {t("platformConsole.rtLiveData")}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.textMuted,
            }}
          />
          <Text style={{ ...typography.caption, color: theme.textMuted }}>
            {t("platformConsole.rtAutoRefresh", {
              sec: data?.autoRefreshSec ?? 15,
            })}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          marginBottom: spacing[4],
        }}
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              style={{
                flex: 1,
                paddingVertical: spacing[3],
                alignItems: "center",
                borderBottomWidth: 2,
                borderBottomColor: active ? theme.success : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: active ? "700" : "500",
                  color: active ? theme.success : theme.textMuted,
                }}
                numberOfLines={1}
              >
                {t(item.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "polling" ? (
        <>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing[3],
              marginBottom: spacing[4],
            }}
          >
            <MiniKpi
              title={t("platformConsole.rtActivePollers")}
              value={fmtNum(p?.activePollers, 0)}
              hint={t("platformConsole.rtActivePollersHint")}
              accent={ACCENT.green}
              historyKey="rt.activePollers"
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtPollRps")}
              value={fmtNum(p?.pollRequestsPerSec)}
              accent={ACCENT.blue}
              historyKey="rt.pollRps"
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtP95")}
              value={fmtMs(p?.p95Ms)}
              hint={
                p?.p50Ms != null
                  ? t("platformConsole.rtP50Hint", { ms: Math.round(p.p50Ms) })
                  : undefined
              }
              accent={ACCENT.purple}
              historyKey="rt.p95Ms"
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtEmptyRatio")}
              value={fmtPct(p?.emptyPollRatio)}
              accent={ACCENT.orange}
              historyKey="rt.emptyRatio"
              emptyTrend={emptyTrend}
            />
          </View>

          <IntervalDistribution
            dist={
              p?.intervalDistribution ?? {
                available: false,
                hotShare: null,
                warmShare: null,
                coldShare: null,
                hotCount: null,
                warmCount: null,
                coldCount: null,
              }
            }
          />

          <Text
            style={{
              ...typography.headline,
              color: theme.text,
              marginBottom: spacing[3],
            }}
          >
            {t("platformConsole.rtPollingHealth")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing[3],
              marginBottom: spacing[3],
            }}
          >
            <MiniKpi
              title={t("platformConsole.rtFailures")}
              value={fmtNum(p?.failuresPerSec)}
              accent={ACCENT.red}
              historyKey="rt.failures"
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtTimeouts")}
              value={fmtNum(p?.timeoutsPerSec)}
              accent={ACCENT.orange}
              historyKey="rt.timeouts"
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtLastError")}
              value={
                p?.lastErrorAgeSec != null
                  ? t("platformConsole.rtAgeSec", {
                      sec: Math.round(p.lastErrorAgeSec),
                    })
                  : "-"
              }
              hint={p?.lastErrorKind ?? undefined}
              accent={ACCENT.red}
              emptyTrend={emptyTrend}
            />
          </View>
        </>
      ) : null}

      {tab === "events" ? (
        <>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing[3],
              marginBottom: spacing[3],
            }}
          >
            <MiniKpi
              title={t("platformConsole.rtEventsPerSec")}
              value={fmtNum(e?.eventsPerSec)}
              accent={ACCENT.green}
              historyKey="rt.eventsPerSec"
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtEventsPerResponse")}
              value={fmtNum(e?.eventsPerResponse)}
              accent={ACCENT.blue}
              historyKey="rt.eventsPerResponse"
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtDrainCap")}
              value={fmtNum(e?.drainCapHits, 0)}
              accent={ACCENT.orange}
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtSeeding")}
              value={fmtNum(e?.seedingBatches, 0)}
              accent={ACCENT.purple}
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtPollNow")}
              value={fmtNum(e?.pollNowCount, 0)}
              accent={ACCENT.green}
              emptyTrend={emptyTrend}
            />
          </View>
          <PlaceholderNote />
        </>
      ) : null}

      {tab === "refresh" ? (
        <>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing[3],
              marginBottom: spacing[3],
            }}
          >
            <MiniKpi
              title={t("platformConsole.rtRefreshRequests")}
              value={fmtNum(r?.requests, 0)}
              accent={ACCENT.blue}
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtRefreshDeferred")}
              value={fmtNum(r?.deferred, 0)}
              accent={ACCENT.orange}
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtRefreshOffline")}
              value={fmtNum(r?.offlineCancelled, 0)}
              accent={ACCENT.red}
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtRefreshDelay")}
              value={fmtMs(r?.avgDelayMs)}
              accent={ACCENT.purple}
              emptyTrend={emptyTrend}
            />
          </View>
          <PlaceholderNote />
        </>
      ) : null}

      {tab === "sync" ? (
        <>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing[3],
              marginBottom: spacing[3],
            }}
          >
            <MiniKpi
              title={t("platformConsole.rtSyncQueue")}
              value={fmtNum(s?.pendingQueue, 0)}
              accent={ACCENT.blue}
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtSyncSuccess")}
              value={fmtPct(s?.successRate)}
              accent={ACCENT.green}
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtSyncRetries")}
              value={fmtNum(s?.retryCount, 0)}
              accent={ACCENT.orange}
              emptyTrend={emptyTrend}
            />
            <MiniKpi
              title={t("platformConsole.rtSyncFailed")}
              value={fmtNum(s?.failedOps, 0)}
              accent={ACCENT.red}
              emptyTrend={emptyTrend}
            />
          </View>
          <PlaceholderNote />
        </>
      ) : null}

      {data ? <SystemStatusBanner status={data.systemStatus} /> : null}
    </View>
  );
}
