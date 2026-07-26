import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { useMe } from "@/features/auth/useMe";
import { listPlatformFeedback } from "@/features/feedback/api";
import type {
  FeedbackDTO,
  FeedbackStatus,
  FeedbackType,
} from "@/features/feedback/schemas";
import { LOCALE_META } from "@/lib/i18n/locales";

type TypeFilter = "all" | FeedbackType;

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[3],
        borderRadius: radius.full,
        backgroundColor: selected ? "transparent" : theme.section,
        borderWidth: 1.5,
        borderColor: selected ? theme.primary : "transparent",
      }}
    >
      <Text
        style={{
          ...typography.caption,
          fontWeight: selected ? "600" : "500",
          color: selected ? theme.primary : theme.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FeedbackRow({
  item,
  onPress,
}: {
  item: FeedbackDTO;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const lang =
    item.language in LOCALE_META
      ? LOCALE_META[item.language as keyof typeof LOCALE_META]
      : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
        backgroundColor: theme.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        padding: spacing[4],
        gap: spacing[2],
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[2],
        }}
      >
        <Text
          style={{
            ...typography.caption,
            fontWeight: "700",
            color: theme.primary,
          }}
        >
          {item.type === "BUG"
            ? t("platformFeedback.typeBug")
            : t("platformFeedback.typeIdea")}
        </Text>
        {item.hasAttachment ? (
          <Text
            accessibilityLabel={t("platformFeedback.hasAttachment")}
            style={{ fontSize: 14 }}
          >
            📷
          </Text>
        ) : null}
        <View style={{ flex: 1 }} />
        <Text style={{ ...typography.caption, color: theme.textMuted }}>
          {t(`platformFeedback.statuses.${item.status}`)}
        </Text>
      </View>
      <Text
        style={{ ...typography.body, fontWeight: "600", color: theme.text }}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      <Text
        style={{ ...typography.caption, color: theme.textMuted }}
        numberOfLines={1}
      >
        {item.user?.email ?? item.userId}
        {lang ? ` · ${lang.emoji} ${lang.id}` : ` · ${item.language}`}
        {item.appVersion ? ` · v${item.appVersion}` : ""}
      </Text>
      <Text style={{ ...typography.caption, color: theme.textMuted }}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </Pressable>
  );
}

export function PlatformFeedbackListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();
  const { data: me, isLoading: meLoading } = useMe();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();

  const [unresolvedOnly, setUnresolvedOnly] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">(
    "all",
  );

  const isAdmin = me?.platformRole === "ADMIN";

  const listQuery = useQuery({
    queryKey: [
      "platform-feedback",
      unresolvedOnly,
      typeFilter,
      statusFilter,
    ],
    enabled: isAdmin,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return listPlatformFeedback(token, {
        unresolvedOnly: unresolvedOnly || undefined,
        type: typeFilter === "all" ? undefined : typeFilter,
        status:
          unresolvedOnly || statusFilter === "all" ? undefined : statusFilter,
      });
    },
  });

  if (meLoading) {
    return (
      <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
        <ActivityIndicator style={{ marginTop: spacing[8] }} color={theme.primary} />
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
        <View style={{ padding: spacing[4] }}>
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")
            }
          >
            <BackIcon color={theme.text} />
          </Pressable>
          <Text
            style={{
              ...typography.body,
              color: theme.textMuted,
              marginTop: spacing[4],
            }}
          >
            {t("platformFeedback.forbidden")}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[3],
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[3],
        }}
      >
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")
          }
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          hitSlop={12}
        >
          <BackIcon color={theme.text} />
        </Pressable>
        <Text style={{ ...typography.title, color: theme.text, flex: 1 }}>
          {t("platformFeedback.title")}
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: spacing[4],
          gap: spacing[2],
          marginBottom: spacing[3],
        }}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[2] }}>
          <Chip
            label={t("platformFeedback.filterUnresolved")}
            selected={unresolvedOnly}
            onPress={() => {
              setUnresolvedOnly(true);
              setStatusFilter("all");
            }}
          />
          <Chip
            label={t("platformFeedback.filterAllStatuses")}
            selected={!unresolvedOnly && statusFilter === "all"}
            onPress={() => {
              setUnresolvedOnly(false);
              setStatusFilter("all");
            }}
          />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[2] }}>
          <Chip
            label={t("platformFeedback.filterAllTypes")}
            selected={typeFilter === "all"}
            onPress={() => setTypeFilter("all")}
          />
          <Chip
            label={t("platformFeedback.typeBug")}
            selected={typeFilter === "BUG"}
            onPress={() => setTypeFilter("BUG")}
          />
          <Chip
            label={t("platformFeedback.typeIdea")}
            selected={typeFilter === "FEATURE_REQUEST"}
            onPress={() => setTypeFilter("FEATURE_REQUEST")}
          />
        </View>
      </View>

      {listQuery.isLoading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <FlatList
          data={listQuery.data?.items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: spacing[4],
            paddingBottom: insets.bottom + spacing[8],
            gap: spacing[3],
          }}
          ListEmptyComponent={
            <Text
              style={{
                ...typography.body,
                color: theme.textMuted,
                textAlign: "center",
                marginTop: spacing[8],
              }}
            >
              {t("platformFeedback.empty")}
            </Text>
          }
          renderItem={({ item }) => (
            <FeedbackRow
              item={item}
              onPress={() =>
                router.push(
                  `/platform-feedback/${item.id}` as unknown as never,
                )
              }
            />
          )}
          onRefresh={() => void listQuery.refetch()}
          refreshing={listQuery.isRefetching}
        />
      )}
    </Screen>
  );
}
