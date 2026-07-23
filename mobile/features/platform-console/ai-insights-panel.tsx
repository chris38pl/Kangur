import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { apiFetch } from "@/lib/api/client";

const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  isPremium: z.boolean(),
  creditsUsed: z.number(),
  creditLimit: z.number().nullable(),
  requestsThisMonth: z.number(),
  listCount: z.number(),
});

const RowSchema = z.object({
  userId: z.string(),
  email: z.string(),
  accountAgeDays: z.number(),
  lastSeenAt: z.string(),
  ownedWorkspaceCount: z.number(),
  workspacesCreatedLast30Days: z.number(),
  aiCreditsUsedThisMonth: z.number(),
  aiRequestsThisMonth: z.number(),
  aiRequestsLastMonth: z.number(),
  aiRequestsLifetime: z.number(),
  quickAiAfterCreateCount: z.number(),
  attentionLevel: z.enum(["low", "medium", "high"]),
  workspaces: z.array(WorkspaceSchema),
});

const InsightsSchema = z.object({
  periodStart: z.string(),
  freeCreditLimit: z.number(),
  rows: z.array(RowSchema),
});

type Insights = z.infer<typeof InsightsSchema>;
type InsightsRow = z.infer<typeof RowSchema>;
type InsightsWorkspace = z.infer<typeof WorkspaceSchema>;

const LEVEL_COLOR = {
  high: "#E05A5A",
  medium: "#F59E0B",
  low: "#2F9E71",
} as const;

const SEARCH_DEBOUNCE_MS = 300;

function formatAccountAge(days: number): string {
  if (days < 1) return "<1 day";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month" : `${months} months`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? "1 year" : `${years} years`;
}

function formatRelative(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diffMs = Math.max(0, now - t);
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function trendArrow(thisMonth: number, lastMonth: number): string {
  if (thisMonth > lastMonth) return "↑";
  if (thisMonth < lastMonth) return "↓";
  return "=";
}

function CreditBar({
  used,
  limit,
  isPremium,
  fillColor,
  trackColor,
}: {
  used: number;
  limit: number | null;
  isPremium: boolean;
  fillColor: string;
  trackColor: string;
}) {
  const ratio = isPremium
    ? 1
    : limit != null && limit > 0
      ? Math.min(1, used / limit)
      : 0;
  const label = isPremium ? "unlimited" : `${used}/${limit ?? "—"}`;

  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: trackColor,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${Math.round(ratio * 100)}%`,
            height: "100%",
            backgroundColor: fillColor,
          }}
        />
      </View>
      <Text
        style={{
          ...typography.caption,
          color: fillColor,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function WorkspaceRow({
  ws,
  theme,
}: {
  ws: InsightsWorkspace;
  theme: (typeof colors)["light"];
}) {
  const fill = ws.isPremium
    ? theme.primary
    : ws.creditLimit != null && ws.creditsUsed >= ws.creditLimit
      ? "#E05A5A"
      : "#3B82F6";

  return (
    <View
      style={{
        paddingVertical: spacing[2],
        borderTopWidth: 1,
        borderTopColor: theme.border,
        gap: spacing[1],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing[2],
        }}
      >
        <Text
          style={{
            ...typography.body,
            color: theme.text,
            fontWeight: "600",
            flex: 1,
          }}
          numberOfLines={1}
        >
          {ws.name}
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: theme.textMuted,
            fontWeight: "700",
            letterSpacing: 0.4,
          }}
        >
          {ws.isPremium ? "PREMIUM" : "FREE"}
        </Text>
      </View>
      <CreditBar
        used={ws.creditsUsed}
        limit={ws.creditLimit}
        isPremium={ws.isPremium}
        fillColor={fill}
        trackColor={theme.border}
      />
      <Text style={{ ...typography.caption, color: theme.textMuted }}>
        {ws.requestsThisMonth} AI req · {ws.listCount} lists
      </Text>
    </View>
  );
}

function KpiCell({
  label,
  value,
  theme,
  showDivider,
}: {
  label: string;
  value: string | number;
  theme: (typeof colors)["light"];
  showDivider?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: spacing[2],
        borderLeftWidth: showDivider ? 1 : 0,
        borderLeftColor: theme.border,
        gap: 4,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          lineHeight: 14,
          color: theme.textMuted,
          fontWeight: "500",
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 22,
          lineHeight: 26,
          color: theme.text,
          fontWeight: "700",
          letterSpacing: -0.3,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function UserCard({
  row,
  theme,
}: {
  row: InsightsRow;
  theme: (typeof colors)["light"];
}) {
  const levelColor = LEVEL_COLOR[row.attentionLevel];
  const arrow = trendArrow(row.aiRequestsThisMonth, row.aiRequestsLastMonth);
  const trendUp = row.aiRequestsThisMonth > row.aiRequestsLastMonth;
  const trendDown = row.aiRequestsThisMonth < row.aiRequestsLastMonth;
  const trendColor = trendUp
    ? "#E67E22"
    : trendDown
      ? "#2F9E71"
      : theme.textMuted;

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: radius.lg,
        padding: spacing[4],
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: theme.border,
        gap: spacing[3],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: spacing[2],
        }}
      >
        <Text
          style={{
            ...typography.body,
            color: theme.text,
            fontWeight: "700",
            flex: 1,
          }}
          numberOfLines={2}
        >
          {row.email}
        </Text>
        <View
          style={{
            paddingHorizontal: spacing[2],
            paddingVertical: 3,
            borderRadius: radius.sm,
            backgroundColor: `${levelColor}22`,
          }}
        >
          <Text
            style={{
              ...typography.caption,
              color: levelColor,
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            {row.attentionLevel}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: spacing[2],
        }}
      >
        <Text style={{ ...typography.caption, color: theme.textMuted }}>
          Account age
        </Text>
        <View
          style={{
            paddingHorizontal: spacing[2],
            paddingVertical: 3,
            borderRadius: radius.full,
            backgroundColor: theme.section,
          }}
        >
          <Text
            style={{
              ...typography.caption,
              color: theme.text,
              fontWeight: "600",
            }}
          >
            {formatAccountAge(row.accountAgeDays)}
          </Text>
        </View>
        <Text style={{ ...typography.caption, color: theme.textMuted }}>
          Last seen
        </Text>
        <View
          style={{
            paddingHorizontal: spacing[2],
            paddingVertical: 3,
            borderRadius: radius.full,
            backgroundColor: theme.section,
          }}
        >
          <Text
            style={{
              ...typography.caption,
              color: theme.text,
              fontWeight: "600",
            }}
          >
            {formatRelative(row.lastSeenAt)}
          </Text>
        </View>
        {row.quickAiAfterCreateCount > 0 ? (
          <>
            <Text style={{ ...typography.caption, color: theme.textMuted }}>
              Quick AI after create
            </Text>
            <View
              style={{
                paddingHorizontal: spacing[2],
                paddingVertical: 3,
                borderRadius: radius.full,
                backgroundColor: theme.section,
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: theme.text,
                  fontWeight: "600",
                }}
              >
                {row.quickAiAfterCreateCount}
              </Text>
            </View>
          </>
        ) : null}
      </View>

      <View>
        <View
          style={{
            flexDirection: "row",
          }}
        >
          <KpiCell
            label="Owned WS"
            value={row.ownedWorkspaceCount}
            theme={theme}
          />
          <KpiCell
            label="Created 30d"
            value={row.workspacesCreatedLast30Days}
            theme={theme}
            showDivider
          />
          <KpiCell
            label={"AI credits\nthis month"}
            value={row.aiCreditsUsedThisMonth}
            theme={theme}
            showDivider
          />
          <KpiCell
            label={"Lifetime\nrequests"}
            value={row.aiRequestsLifetime}
            theme={theme}
            showDivider
          />
        </View>

        <View
          style={{
            marginTop: spacing[2],
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 4,
          }}
        >
          <Text style={{ ...typography.caption, color: theme.text }}>
            This month {row.aiRequestsThisMonth}
          </Text>
          <Text
            style={{
              fontSize: 14,
              lineHeight: 18,
              fontWeight: "700",
              color: trendColor,
            }}
          >
            {arrow}
          </Text>
          <Text style={{ ...typography.caption, color: theme.textMuted }}>
            last month {row.aiRequestsLastMonth}
          </Text>
        </View>
      </View>

      <View>
        {row.workspaces.map((ws) => (
          <WorkspaceRow key={ws.id} ws={ws} theme={theme} />
        ))}
      </View>
    </View>
  );
}

function useAiInsightsQuery(enabled: boolean, q: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["platform", "ai-insights", q],
    enabled,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing token");
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const qs = params.toString();
      const path = qs
        ? `/api/v1/platform/ai-insights?${qs}`
        : "/api/v1/platform/ai-insights";
      const data = await apiFetch<unknown>(path, { token });
      return InsightsSchema.parse(data);
    },
  });
}

export function AiInsightsPanel({ enabled }: { enabled: boolean }) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const onChangeQuery = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(text.trim());
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const insightsQuery = useAiInsightsQuery(enabled, debouncedQ);
  const data = insightsQuery.data;
  const loading = insightsQuery.isLoading;
  const refreshing = insightsQuery.isFetching;
  const errorMessage = insightsQuery.error
    ? insightsQuery.error instanceof Error
      ? insightsQuery.error.message
      : "Failed to load AI Insights"
    : null;

  return (
    <View style={{ gap: spacing[3], paddingTop: spacing[1] }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing[3],
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...typography.headline, color: theme.text }}>
            AI Insights
          </Text>
          <Text style={{ ...typography.caption, color: theme.textMuted }}>
            Review hint only — not an abuse verdict. Manual refresh.
          </Text>
        </View>
        <Pressable
          onPress={() => {
            void insightsQuery.refetch();
          }}
          disabled={refreshing || loading}
          accessibilityRole="button"
          accessibilityLabel="Refresh AI Insights"
          style={{
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            borderRadius: radius.md,
            backgroundColor: theme.primary,
            opacity: refreshing || loading ? 0.6 : 1,
          }}
        >
          <Text
            style={{
              ...typography.caption,
              color: "#fff",
              fontWeight: "700",
            }}
          >
            {refreshing ? "…" : "Refresh"}
          </Text>
        </Pressable>
      </View>

      <TextInput
        value={query}
        onChangeText={onChangeQuery}
        placeholder="Search user or workspace"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        accessibilityLabel="Search user or workspace"
        style={{
          ...typography.body,
          color: theme.text,
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          borderWidth: 1,
          borderColor: theme.border,
        }}
      />

      {loading && !data ? (
        <View style={{ paddingVertical: spacing[8], alignItems: "center" }}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : null}

      {errorMessage ? (
        <Text style={{ ...typography.body, color: "#E05A5A" }}>
          {errorMessage}
        </Text>
      ) : null}

      {data && data.rows.length === 0 ? (
        <Text style={{ ...typography.body, color: theme.textMuted }}>
          {debouncedQ
            ? `No matches for “${debouncedQ}”.`
            : "No workspace owners to review yet."}
        </Text>
      ) : null}

      {data?.rows.map((row) => (
        <UserCard key={row.userId} row={row} theme={theme} />
      ))}
    </View>
  );
}
