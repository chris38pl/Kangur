import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { intlLocaleTag } from "@/lib/i18n/locales";
import { useAiCredits } from "@/features/billing/useAiCredits";
import type { Workspace } from "@/features/workspace/schemas";

type Props = {
  workspace: Workspace;
  emoji: string;
  onMenuPress?: () => void;
};

function formatRefreshDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(intlLocaleTag(locale), {
      day: "numeric",
      month: "long",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function WorkspaceSummaryCard({ workspace, emoji, onMenuPress }: Props) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const creditsQuery = useAiCredits(workspace.id);

  const roleLabel = workspace.isOwner
    ? t("workspace.roleOwner")
    : t("workspace.roleEditor");

  const credits = creditsQuery.data;
  const limit = credits?.limit ?? 0;
  const remaining = credits?.remaining ?? 0;
  const unlimited = credits?.unlimited ?? false;
  const progress =
    unlimited || limit <= 0 ? 1 : Math.min(1, Math.max(0, remaining / limit));

  const roleBadge =
    workspace.isOwner || workspace.role === "owner"
      ? { background: "#EAF7F2", text: theme.primary }
      : { background: theme.surface, text: theme.textMuted };

  return (
    <View
      style={{
        marginTop: 0,
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[4],
        borderRadius: radius.xl,
        backgroundColor: theme.section,
        gap: spacing[3],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[3],
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: radius.full,
            backgroundColor: theme.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 28 }}>{emoji}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{ ...typography.headline, color: theme.text }}
          >
            {workspace.name}
          </Text>
          <View
            style={{
              marginTop: spacing[1],
              alignSelf: "flex-start",
              backgroundColor: roleBadge.background,
              borderRadius: radius.full,
              paddingHorizontal: spacing[2] + 2,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                ...typography.caption,
                fontWeight: "600",
                color: roleBadge.text,
              }}
            >
              {roleLabel}
            </Text>
          </View>
        </View>

        {onMenuPress ? (
          <Pressable
            onPress={onMenuPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("workspace.editMenu")}
            style={{
              width: 28,
              height: 28,
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
              ⋯
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View>
        <Text style={{ ...typography.caption, color: theme.textMuted }}>
          {t("billing.aiCredits")}
        </Text>

        {creditsQuery.isPending ? (
          <ActivityIndicator
            size="small"
            color={theme.primary}
            style={{ marginTop: spacing[2], alignSelf: "flex-start" }}
          />
        ) : creditsQuery.isError || !credits ? (
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              marginTop: spacing[1],
            }}
          >
            -
          </Text>
        ) : unlimited ? (
          <View
            style={{
              marginTop: 2,
              flexDirection: "row",
              alignItems: "baseline",
              gap: spacing[2],
            }}
          >
            <Text
              style={{
                ...typography.headline,
                color: theme.primary,
                fontSize: 22,
                lineHeight: 28,
              }}
            >
              ∞
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                fontSize: 11,
                lineHeight: 14,
              }}
            >
              {t("billing.aiCreditsUnlimited")}
            </Text>
          </View>
        ) : (
          <>
            <View
              style={{
                marginTop: 2,
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: spacing[2],
              }}
            >
              <Text>
                <Text
                  style={{
                    ...typography.headline,
                    color: theme.primary,
                    fontSize: 22,
                    lineHeight: 28,
                  }}
                >
                  {remaining}
                </Text>
                <Text
                  style={{
                    ...typography.headline,
                    color: theme.primaryLight,
                    fontSize: 18,
                    lineHeight: 28,
                  }}
                >
                  {" / "}
                  {limit}
                </Text>
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  fontSize: 11,
                  lineHeight: 14,
                  flexShrink: 1,
                  textAlign: "right",
                }}
              >
                {t("billing.creditsRefreshed", {
                  date: formatRefreshDate(credits.periodStart, i18n.language),
                })}
              </Text>
            </View>
            <View
              style={{
                marginTop: spacing[2],
                width: "100%",
                height: 6,
                borderRadius: radius.full,
                backgroundColor: `${theme.primary}22`,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  height: "100%",
                  backgroundColor: theme.primary,
                  borderRadius: radius.full,
                }}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}
