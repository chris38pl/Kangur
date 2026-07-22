import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useAppResult } from "@/components/AppResultProvider";
import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { createMealProposal } from "@/features/ai/api";
import { setPendingMealProposal } from "@/features/ai/pending-meal-proposal";
import {
  getCreditShortage,
  isInsufficientCreditsError,
} from "@/lib/ai/insufficientCredits";
import { Analytics } from "@/lib/analytics";
import { ApiClientError } from "@/lib/api/client";

const MAX_DISHES = 5;

/** Distinct chip colors for up to 5 dish badges (index = badge order). */
const DISH_BADGE_COLORS = [
  { background: "#DFF5EF", text: "#1F6B5F", border: "#9FD9CB" },
  { background: "#FFE8D6", text: "#9A4E1B", border: "#F0C39A" },
  { background: "#E4EEFF", text: "#2F4F9A", border: "#A8BFE8" },
  { background: "#F3E5F5", text: "#7A3E8A", border: "#D2A8DB" },
  { background: "#FFF3C4", text: "#8A6A12", border: "#E6D07A" },
] as const;

type Props = {
  listId: string;
  workspaceId: string;
  onGeneratingChange?: (generating: boolean) => void;
  /** When wrapped in an outer collapsible section, hide the in-composer title. */
  hideTitle?: boolean;
};

export function MealProposalComposer({
  listId,
  workspaceId,
  onGeneratingChange,
  hideTitle = false,
}: Props) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const router = useRouter();
  const { showInsufficientCredits } = useAppResult();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const [draft, setDraft] = useState("");
  const [dishes, setDishes] = useState<string[]>([]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return createMealProposal(token, listId, dishes);
    },
    onSuccess: (response) => {
      setPendingMealProposal({ listId, workspaceId, response, mealIndex: 0 });
      setDraft("");
      setDishes([]);
      router.push(`/list/${listId}/meal-proposal/review` as never);
    },
    onError: (error) => {
      Analytics.track("meal_proposal_failed", {
        workspace_id: workspaceId,
        list_id: listId,
        code:
          error instanceof ApiClientError
            ? String(error.status)
            : "generate_error",
      });
      if (isInsufficientCreditsError(error)) {
        const shortage = getCreditShortage(error) ?? {
          needed: 2,
          remaining: 0,
        };
        showInsufficientCredits({
          ...shortage,
          description: t("ai.mealProposalCreditsError"),
        });
      }
    },
  });

  const busy = generateMutation.isPending;

  useEffect(() => {
    onGeneratingChange?.(busy);
    return () => onGeneratingChange?.(false);
  }, [busy, onGeneratingChange]);

  const addDish = () => {
    const value = draft.trim();
    if (!value || dishes.length >= MAX_DISHES) return;
    if (dishes.some((d) => d.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    setDishes((prev) => [...prev, value]);
    setDraft("");
  };

  const canAdd = Boolean(draft.trim()) && dishes.length < MAX_DISHES && !busy;
  const canGenerate = dishes.length >= 1 && !busy;

  return (
    <View style={{ marginTop: hideTitle ? spacing[3] : spacing[5] }}>
      {hideTitle ? null : (
        <Text style={{ ...typography.headline, color: theme.text }}>
          {t("ai.mealProposalTitle")}
        </Text>
      )}
      <Text
        style={{
          ...typography.body,
          color: theme.textBody,
          marginTop: hideTitle ? 0 : spacing[2],
        }}
      >
        {t("ai.mealProposalSubtitle")}
      </Text>

      <View
        style={{
          marginTop: spacing[4],
          flexDirection: "row",
          gap: spacing[2],
          alignItems: "center",
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          editable={!busy && dishes.length < MAX_DISHES}
          placeholder={t("ai.mealProposalPlaceholder")}
          placeholderTextColor={theme.textMuted}
          onSubmitEditing={addDish}
          returnKeyType="done"
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.surface,
            borderRadius: radius.lg,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            color: theme.text,
            minHeight: 48,
          }}
        />
        <Pressable
          disabled={!canAdd}
          onPress={addDish}
          style={{
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            borderRadius: radius.lg,
            backgroundColor: theme.primary,
            opacity: canAdd ? 1 : 0.5,
            minHeight: 48,
            justifyContent: "center",
          }}
        >
          <Text style={{ ...typography.label, color: theme.onPrimary }}>
            {t("ai.mealProposalAdd")}
          </Text>
        </Pressable>
      </View>

      {dishes.length > 0 ? (
        <View
          style={{
            marginTop: spacing[3],
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing[2],
          }}
        >
          {dishes.map((dish, index) => {
            const badge =
              DISH_BADGE_COLORS[index % DISH_BADGE_COLORS.length] ??
              DISH_BADGE_COLORS[0];
            return (
              <Pressable
                key={`${dish}-${index}`}
                onPress={() =>
                  setDishes((prev) => prev.filter((_, i) => i !== index))
                }
                disabled={busy}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[2],
                  paddingVertical: spacing[2],
                  paddingHorizontal: spacing[3],
                  borderRadius: radius.full,
                  backgroundColor: badge.background,
                  borderWidth: 1,
                  borderColor: badge.border,
                }}
              >
                <Text
                  style={{
                    ...typography.caption,
                    color: badge.text,
                    fontWeight: "600",
                  }}
                >
                  {dish}
                </Text>
                <Text style={{ color: badge.text, opacity: 0.7 }}>×</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {dishes.length >= MAX_DISHES ? (
        <Text
          style={{
            ...typography.caption,
            color: theme.textMuted,
            marginTop: spacing[2],
          }}
        >
          {t("ai.mealProposalMaxDishes")}
        </Text>
      ) : null}

      <Pressable
        disabled={!canGenerate}
        onPress={() => generateMutation.mutate()}
        style={{
          marginTop: spacing[4],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing[2],
          backgroundColor: theme.primary,
          borderRadius: radius.lg,
          paddingVertical: spacing[4],
          opacity: canGenerate ? 1 : 0.6,
        }}
      >
        {busy ? (
          <>
            <ActivityIndicator color={theme.onPrimary} />
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("ai.mealProposalGenerating")}
            </Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 14, color: theme.onPrimary }}>🍽️</Text>
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("ai.mealProposalGenerate")}
            </Text>
          </>
        )}
      </Pressable>

      {generateMutation.isError &&
      !isInsufficientCreditsError(generateMutation.error) ? (
        <Text
          style={{
            ...typography.caption,
            color: "#E05A5A",
            marginTop: spacing[2],
          }}
        >
          {t("ai.mealProposalGenerateError")}
        </Text>
      ) : null}
    </View>
  );
}
