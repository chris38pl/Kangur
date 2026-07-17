import { router } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { KangurMascot } from "@/components/KangurMascot";
import { useColorScheme } from "@/components/useColorScheme";
import {
  cardStyle,
  primaryButtonStyle,
} from "@/design-system/shopping-density";
import { colors, spacing, typography } from "@/design-system/tokens";
import { useCreateList } from "@/features/shopping-list/create-list-provider";
import {
  type CreateListPath,
} from "@/features/shopping-list/create-list-sheet";
import { useResumableSessions } from "@/features/shopping-list/session/useResumableSessions";
import {
  useCreateShoppingList,
  useShoppingLists,
} from "@/features/shopping-list/useShoppingLists";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";

function greetingKey():
  | "home.greetingMorning"
  | "home.greetingAfternoon"
  | "home.greetingEvening" {
  const h = new Date().getHours();
  if (h < 12) return "home.greetingMorning";
  if (h < 18) return "home.greetingAfternoon";
  return "home.greetingEvening";
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const workspacesQuery = useWorkspaces();
  const { activeWorkspace, hydrated } = useActiveWorkspace(workspacesQuery.data);
  const listsQuery = useShoppingLists(activeWorkspace?.id ?? null, hydrated);
  const sessionsQuery = useResumableSessions(hydrated);
  const createList = useCreateShoppingList(activeWorkspace?.id ?? null);
  const { openCreateList } = useCreateList();

  const lists = useMemo(() => listsQuery.data ?? [], [listsQuery.data]);
  const resumable = useMemo(() => {
    const sessions = sessionsQuery.data ?? [];
    return sessions.flatMap((session) => {
      const list = lists.find((l) => l.id === session.listId);
      if (!list || list.status !== "active") return [];
      return [{ session, list }];
    });
  }, [sessionsQuery.data, lists]);

  const isEmpty = lists.length === 0 && resumable.length === 0;

  const createAndOpen = async (path: CreateListPath) => {
    if (!activeWorkspace) return;
    try {
      const list = await createList.mutateAsync({
        name:
          path === "empty" ? t("home.defaultListName") : t("home.aiListName"),
        emoji: "🛒",
      });
      if (path === "empty") {
        router.push(`/list/${list.id}` as never);
        return;
      }
      if (path === "voice") return;
      const importSource =
        path === "clipboard"
          ? "clipboard"
          : path === "photo"
            ? "photo"
            : "screenshot";
      router.push(`/list/${list.id}?import=${importSource}` as never);
    } catch {
      // keep sheet open
    }
  };

  if (workspacesQuery.isPending || !hydrated || listsQuery.isPending) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.section,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.section }}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing[6],
          paddingBottom: spacing[10],
        }}
      >
        <Text style={{ ...typography.caption, color: theme.textMuted }}>
          {activeWorkspace?.name ?? t("home.noWorkspace")}
        </Text>
        <Text
          style={{
            ...typography.display,
            color: theme.text,
            marginTop: spacing[2],
          }}
        >
          {t(greetingKey())}
        </Text>
        <Text
          style={{
            ...typography.body,
            color: theme.textBody,
            marginTop: spacing[1],
          }}
        >
          {t("home.subtitle")}
        </Text>

        {resumable.length > 0 ? (
          <View style={{ marginTop: spacing[8] }}>
            <Text style={{ ...typography.label, color: theme.textMuted }}>
              {t("home.continueShopping")}
            </Text>
            {resumable.map(({ list }) => (
              <Pressable
                key={list.id}
                onPress={() => router.push(`/list/${list.id}/shop` as never)}
                style={{
                  marginTop: spacing[3],
                  ...cardStyle(theme),
                  backgroundColor: theme.accent,
                  borderColor: theme.primaryLight,
                }}
              >
                <Text style={{ fontSize: 28 }}>{list.emoji}</Text>
                <Text
                  style={{
                    ...typography.headline,
                    color: theme.text,
                    marginTop: spacing[2],
                  }}
                >
                  {list.name}
                </Text>
                <Text
                  style={{
                    ...typography.label,
                    color: theme.primary,
                    marginTop: spacing[3],
                  }}
                >
                  {t("home.resume")} →
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {isEmpty ? (
          <View
            style={{
              marginTop: spacing[10],
              alignItems: "center",
              paddingHorizontal: spacing[2],
            }}
          >
            <KangurMascot variant="hero" width={280} height={220} />
            <Text
              style={{
                ...typography.title,
                color: theme.text,
                textAlign: "center",
                marginTop: spacing[6],
              }}
            >
              {t("home.onboardingTitle")}
            </Text>
            <Text
              style={{
                ...typography.body,
                color: theme.textBody,
                textAlign: "center",
                marginTop: spacing[2],
              }}
            >
              {t("home.onboardingBody")}
            </Text>
            <Pressable
              onPress={openCreateList}
              style={{
                ...primaryButtonStyle(theme),
                marginTop: spacing[6],
                width: "100%",
              }}
            >
              <Text style={{ ...typography.label, color: theme.onPrimary }}>
                {t("home.onboardingCta")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void createAndOpen("screenshot")}
              style={{ marginTop: spacing[4], paddingVertical: spacing[2] }}
            >
              <Text style={{ ...typography.label, color: theme.primary }}>
                {t("home.onboardingAi")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ marginTop: spacing[8] }}>
              <Text style={{ ...typography.label, color: theme.textMuted }}>
                {t("home.quickActions")}
              </Text>
              <View
                style={{
                  marginTop: spacing[3],
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: spacing[3],
                }}
              >
                {(
                  [
                    ["screenshot", "📷", t("home.createScreenshot")],
                    ["clipboard", "📋", t("home.createClipboard")],
                    ["photo", "🖼️", t("home.createPhoto")],
                    ["empty", "✏️", t("home.createEmpty")],
                  ] as const
                ).map(([path, icon, label]) => (
                  <Pressable
                    key={path}
                    onPress={() => void createAndOpen(path)}
                    style={{
                      width: "47%",
                      flexGrow: 1,
                      minHeight: 100,
                      ...cardStyle(theme),
                      padding: spacing[4],
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{icon}</Text>
                    <Text
                      style={{
                        ...typography.label,
                        color: theme.text,
                        marginTop: spacing[3],
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ marginTop: spacing[8] }}>
              <Text style={{ ...typography.label, color: theme.textMuted }}>
                {t("home.recentLists")}
              </Text>
              <View style={{ marginTop: spacing[3], gap: spacing[3] }}>
                {lists.map((list) => (
                  <Pressable
                    key={list.id}
                    onPress={() => router.push(`/list/${list.id}` as never)}
                    style={{
                      ...cardStyle(theme),
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing[3],
                      padding: spacing[4],
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>{list.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ ...typography.headline, color: theme.text }}
                      >
                        {list.name}
                      </Text>
                      <Text
                        style={{
                          ...typography.caption,
                          color: theme.textMuted,
                          marginTop: spacing[1],
                        }}
                      >
                        {t("home.openList")}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
