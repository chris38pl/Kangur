import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { abandonMealProposal, applyAi } from "@/features/ai/api";
import {
  clearPendingMealProposal,
  getPendingMealProposal,
  updatePendingMealProposal,
} from "@/features/ai/pending-meal-proposal";
import type { MealProposalOperation } from "@/features/ai/schemas";
import { BackIcon } from "@/features/auth/auth-icons";
import { getCategoryBadgeColors } from "@/features/shopping-item/category-badge-colors";
import { Analytics } from "@/lib/analytics";
import { ApiClientError } from "@/lib/api/client";

type Props = { listId: string };

const CHECKED = "#2F8F84";

function IngredientRow({
  operation,
  included,
  onToggle,
}: {
  operation: MealProposalOperation;
  included: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const badge = getCategoryBadgeColors(operation.category);
  const subtitle = [operation.amount, operation.note]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: included }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        opacity: included ? 1 : 0.55,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            ...typography.headline,
            fontSize: 16,
            lineHeight: 22,
            color: included ? theme.text : theme.textMuted,
          }}
        >
          {operation.name}
        </Text>
        {subtitle ? (
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          paddingHorizontal: spacing[3],
          paddingVertical: 4,
          borderRadius: radius.full,
          backgroundColor: badge.background,
        }}
      >
        <Text
          style={{
            ...typography.caption,
            fontSize: 12,
            fontWeight: "600",
            color: badge.text,
          }}
          numberOfLines={1}
        >
          {t(`categories.${operation.category}`)}
        </Text>
      </View>

      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: included ? CHECKED : theme.bg,
          borderWidth: included ? 0 : 1.5,
          borderColor: theme.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {included ? (
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
            ✓
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function MealProposalReviewScreen({ listId }: Props) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const stored = getPendingMealProposal();
  const [mealIndex, setMealIndex] = useState(stored?.mealIndex ?? 0);
  const [acceptedRowIds, setAcceptedRowIds] = useState<string[]>(
    () => stored?.acceptedRowIds ?? [],
  );
  const [rejectedMealIds, setRejectedMealIds] = useState<string[]>(
    () => stored?.rejectedMealIds ?? [],
  );
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());

  const pending = getPendingMealProposal();
  const meals = pending?.response.proposal.meals ?? [];
  const meal = meals[mealIndex];
  const allOps = pending?.response.proposal.operations ?? [];
  const mealOps = useMemo(
    () =>
      meal ? allOps.filter((op) => op.ownerMealId === meal.mealId) : [],
    [allOps, meal],
  );
  const includedCount = mealOps.filter(
    (op) => !excluded.has(op.proposalRowId),
  ).length;

  const finishMutation = useMutation({
    mutationFn: async (input: {
      acceptedRowIds: string[];
      abandon: boolean;
    }) => {
      const token = await getToken();
      if (!token || !pending) throw new Error("Missing auth");
      if (input.abandon || input.acceptedRowIds.length === 0) {
        await abandonMealProposal(token, listId, pending.response.runId);
        return { applied: 0 };
      }
      const ops = allOps
        .filter((op) => input.acceptedRowIds.includes(op.proposalRowId))
        .map((op) => {
          if (op.op === "merge" && op.targetItemId) {
            return {
              op: "merge" as const,
              proposalRowId: op.proposalRowId,
              targetItemId: op.targetItemId,
              name: op.name,
              amount: op.amount ?? null,
              note: op.note ?? null,
              category: op.category,
            };
          }
          return {
            op: "create" as const,
            proposalRowId: op.proposalRowId,
            name: op.name,
            amount: op.amount ?? null,
            note: op.note ?? null,
            category: op.category,
          };
        });
      const ignored = allOps
        .filter((op) => !input.acceptedRowIds.includes(op.proposalRowId))
        .map((op) => ({
          op: "ignore" as const,
          proposalRowId: op.proposalRowId,
        }));
      return applyAi(token, listId, {
        runId: pending.response.runId,
        operations: [...ops, ...ignored],
      });
    },
    onSuccess: (result) => {
      const workspaceId = pending?.workspaceId;
      const mealCount = Math.min(5, Math.max(1, meals.length));
      if (result.applied > 0 && workspaceId) {
        Analytics.track("meal_proposal_accepted", {
          workspace_id: workspaceId,
          list_id: listId,
          meal_count: mealCount,
        });
      }
      clearPendingMealProposal();
      void queryClient.invalidateQueries({
        queryKey: ["shopping-items", listId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["shopping-list", listId],
      });
      router.replace(`/list/${listId}` as never);
    },
    onError: (error) => {
      const workspaceId = pending?.workspaceId;
      if (workspaceId) {
        Analytics.track("meal_proposal_failed", {
          workspace_id: workspaceId,
          list_id: listId,
          code:
            error instanceof ApiClientError
              ? String(error.status)
              : "apply_error",
        });
      }
    },
  });

  const advance = (acceptedForMeal: string[], rejectMeal: boolean) => {
    if (!pending || !meal) return;
    const nextAccepted = rejectMeal
      ? acceptedRowIds
      : [...acceptedRowIds, ...acceptedForMeal];
    const nextRejected = rejectMeal
      ? [...rejectedMealIds, meal.mealId]
      : rejectedMealIds;
    const nextIndex = mealIndex + 1;
    if (nextIndex < meals.length) {
      setAcceptedRowIds(nextAccepted);
      setRejectedMealIds(nextRejected);
      setMealIndex(nextIndex);
      setExcluded(new Set());
      updatePendingMealProposal({
        acceptedRowIds: nextAccepted,
        rejectedMealIds: nextRejected,
        mealIndex: nextIndex,
      });
      return;
    }
    finishMutation.mutate({
      acceptedRowIds: nextAccepted,
      abandon:
        nextAccepted.length === 0 || nextRejected.length === meals.length,
    });
  };

  if (!pending || pending.listId !== listId || !meal) {
    return (
      <Screen style={{ backgroundColor: theme.bg }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing[6],
          }}
        >
          <Text style={{ ...typography.body, color: theme.textMuted }}>
            {t("ai.mealProposalMissing")}
          </Text>
          <Pressable
            onPress={() => router.replace(`/list/${listId}` as never)}
            style={{ marginTop: spacing[4] }}
          >
            <Text style={{ ...typography.label, color: theme.primary }}>
              {t("ai.mealProposalBackToList")}
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const busy = finishMutation.isPending;
  const progress = (mealIndex + 1) / Math.max(meals.length, 1);

  return (
    <Screen style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingTop: spacing[2],
          paddingBottom: spacing[3],
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => {
              clearPendingMealProposal();
              router.back();
            }}
            hitSlop={10}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BackIcon size={20} />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                ...typography.caption,
                fontWeight: "600",
                color: theme.textMuted,
              }}
            >
              {t("ai.mealProposalStep", {
                current: mealIndex + 1,
                total: meals.length,
              })}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View
          style={{
            marginTop: spacing[3],
            height: 3,
            borderRadius: 2,
            backgroundColor: theme.border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${Math.round(progress * 100)}%`,
              height: "100%",
              backgroundColor: theme.primary,
            }}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[6] + insets.bottom + 140,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[3],
            marginTop: spacing[2],
            marginBottom: spacing[5],
          }}
        >
          <Text style={{ fontSize: 48 }}>{meal.icon}</Text>
          <Text
            style={{
              ...typography.title,
              fontSize: 28,
              lineHeight: 34,
              color: theme.text,
              flex: 1,
            }}
            numberOfLines={2}
          >
            {meal.title}
          </Text>
        </View>

        <Text
          style={{
            ...typography.caption,
            fontWeight: "700",
            letterSpacing: 0.4,
            color: theme.textMuted,
            marginBottom: spacing[2],
          }}
        >
          {t("ai.mealProposalIngredients").toUpperCase()}
        </Text>

        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: "hidden",
          }}
        >
          {mealOps.map((op) => (
            <IngredientRow
              key={op.proposalRowId}
              operation={op}
              included={!excluded.has(op.proposalRowId)}
              onToggle={() => {
                setExcluded((prev) => {
                  const next = new Set(prev);
                  if (next.has(op.proposalRowId)) next.delete(op.proposalRowId);
                  else next.add(op.proposalRowId);
                  return next;
                });
              }}
            />
          ))}
        </View>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing[4],
          paddingTop: spacing[3],
          paddingBottom: insets.bottom + spacing[4],
          backgroundColor: theme.bg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}
      >
        <Pressable
          disabled={busy}
          onPress={() => {
            const accepted = mealOps
              .filter((op) => !excluded.has(op.proposalRowId))
              .map((op) => op.proposalRowId);
            advance(accepted, false);
          }}
          style={{
            backgroundColor: theme.primary,
            borderRadius: radius.lg,
            paddingVertical: spacing[4],
            alignItems: "center",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? (
            <ActivityIndicator color={theme.onPrimary} />
          ) : (
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("ai.suggestAddProducts", { count: includedCount })}
            </Text>
          )}
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={() => advance([], true)}
          style={{
            marginTop: spacing[3],
            paddingVertical: spacing[3],
            alignItems: "center",
          }}
        >
          <Text style={{ ...typography.label, color: theme.primary }}>
            {t("ai.mealProposalReject")}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
