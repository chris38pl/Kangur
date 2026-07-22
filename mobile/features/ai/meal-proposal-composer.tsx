import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { createMealProposal } from "@/features/ai/api";
import { setPendingMealProposal } from "@/features/ai/pending-meal-proposal";
import { Analytics } from "@/lib/analytics";
import { ApiClientError } from "@/lib/api/client";

const MAX_DISHES = 2;

type Props = { listId: string; workspaceId: string };

export function MealProposalComposer({ listId, workspaceId }: Props) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const router = useRouter();
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
    },
  });

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

  const busy = generateMutation.isPending;
  const canAdd = Boolean(draft.trim()) && dishes.length < MAX_DISHES && !busy;
  const canGenerate = dishes.length >= 1 && !busy;

  return (
    <View style={{ marginTop: spacing[5] }}>
      <Text style={{ ...typography.headline, color: theme.text }}>
        {t("ai.mealProposalTitle")}
      </Text>
      <Text
        style={{
          ...typography.body,
          color: theme.textBody,
          marginTop: spacing[2],
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
          {dishes.map((dish, index) => (
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
                backgroundColor: theme.section,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ ...typography.caption, color: theme.text }}>
                {dish}
              </Text>
              <Text style={{ color: theme.textMuted }}>×</Text>
            </Pressable>
          ))}
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
          <ActivityIndicator color={theme.onPrimary} />
        ) : (
          <>
            <Text style={{ fontSize: 14, color: theme.onPrimary }}>🍽️</Text>
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("ai.mealProposalGenerate")}
            </Text>
          </>
        )}
      </Pressable>

      {generateMutation.isError ? (
        <Text
          style={{
            ...typography.caption,
            color: "#E05A5A",
            marginTop: spacing[2],
          }}
        >
          {generateMutation.error instanceof ApiClientError &&
          generateMutation.error.status === 402
            ? t("ai.mealProposalCreditsError")
            : t("ai.mealProposalGenerateError")}
        </Text>
      ) : null}
    </View>
  );
}
