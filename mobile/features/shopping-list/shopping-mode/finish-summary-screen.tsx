import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { shoppingDensity } from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { OfflineStatusBanner } from "@/features/offline/OfflineStatusBanner";
import { DataSyncEngine } from "@/features/data-sync-engine";
import { useShoppingItems } from "@/features/shopping-item/useShoppingItems";
import { useShoppingSession } from "@/features/shopping-list/session/useShoppingSession";
import { useShoppingList } from "@/features/shopping-list/useShoppingLists";

type Props = {
  listId: string;
};

export function FinishSummaryScreen({ listId }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const router = useRouter();
  const queryClient = useQueryClient();
  const listQuery = useShoppingList(listId);
  const itemsQuery = useShoppingItems(listId);
  const session = useShoppingSession(listId);

  const counts = useMemo(() => {
    const items = itemsQuery.data ?? [];
    return {
      purchased: items.filter((i) => i.status === "bought").length,
      unavailable: items.filter((i) => i.status === "unavailable").length,
      remaining: items.filter((i) => i.status === "pending").length,
    };
  }, [itemsQuery.data]);

  const finish = useMutation({
    mutationFn: async () => {
      await session.finish();
    },
    onSuccess: async () => {
      const workspaceId = listQuery.data?.workspaceId;
      // Hide from local home immediately
      if (workspaceId) {
        queryClient.setQueryData(
          ["shopping-lists", workspaceId],
          (prev: { id: string }[] | undefined) =>
            prev?.filter((l) => l.id !== listId) ?? prev,
        );
      }
      await queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
      if (!DataSyncEngine.isOnline()) {
        // Finish anyway — queue will flush later
      }
      await session.clearEnded();
      router.replace("/(tabs)");
    },
  });

  if (listQuery.isPending || itemsQuery.isPending) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.section,
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <Screen style={{ backgroundColor: theme.section }}>
      <OfflineStatusBanner listId={listId} />
      <View style={{ flex: 1, padding: spacing[6] }}>
        <Text style={{ ...typography.title, color: theme.text }}>
          {t("shoppingMode.finishTitle")}
        </Text>
        <Text
          style={{
            ...typography.body,
            color: theme.textMuted,
            marginTop: spacing[2],
          }}
        >
          {listQuery.data?.name}
        </Text>

        {!DataSyncEngine.isOnline() ? (
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              marginTop: spacing[4],
            }}
          >
            {t("offline.finishAnywayHint")}
          </Text>
        ) : null}

        <View style={{ marginTop: spacing[8], gap: spacing[4] }}>
          <Text style={{ ...typography.headline, color: theme.text }}>
            {t("shoppingMode.summaryPurchased", { count: counts.purchased })}
          </Text>
          <Text style={{ ...typography.headline, color: theme.text }}>
            {t("shoppingMode.summaryUnavailable", {
              count: counts.unavailable,
            })}
          </Text>
          {counts.remaining > 0 ? (
            <Text style={{ ...typography.body, color: theme.textMuted }}>
              {t("shoppingMode.summaryRemaining", { count: counts.remaining })}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => void finish.mutateAsync()}
          disabled={finish.isPending}
          style={{
            marginTop: spacing[10],
            backgroundColor: theme.primary,
            borderRadius: radius.md,
            paddingVertical: spacing[4],
            alignItems: "center",
            minHeight: shoppingDensity.primaryCtaMinHeight,
            justifyContent: "center",
            opacity: finish.isPending ? 0.7 : 1,
          }}
        >
          <Text style={{ ...typography.label, color: "#fff" }}>
            {DataSyncEngine.isOnline()
              ? t("shoppingMode.archiveList")
              : t("offline.finishAnyway")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: spacing[4], alignItems: "center" }}
        >
          <Text style={{ ...typography.label, color: theme.textMuted }}>
            {t("shoppingMode.keepShopping")}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
