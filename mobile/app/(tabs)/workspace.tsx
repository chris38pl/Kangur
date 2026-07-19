import { getWorkspaceIconEmoji } from "@shared/workspace-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { useMe } from "@/features/auth/useMe";
import { CreateWorkspaceSheet } from "@/features/workspace/create-workspace-sheet";
import { EditWorkspaceSheet } from "@/features/workspace/edit-workspace-sheet";
import { PremiumUpgradeBanner } from "@/features/billing/premium-upgrade-banner";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useUpdateWorkspace } from "@/features/workspace/useUpdateWorkspace";
import { useWorkspaceMembers } from "@/features/workspace/useWorkspaceMembers";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { WorkspaceInviteSection } from "@/features/workspace/workspace-invite-section";
import { WorkspaceMembersList } from "@/features/workspace/workspace-members-list";
import { WorkspaceSummaryCard } from "@/features/workspace/workspace-summary-card";
import { WorkspaceSwitcher } from "@/features/workspace/workspace-switcher";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { useTabBarClearance } from "@/hooks/useSafeAreaLayout";

export default function WorkspaceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const tabClearance = useTabBarClearance();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ScrollView>(null);
  const inviteFocusedRef = useRef(false);
  const workspacesQuery = useWorkspaces();
  const { activeWorkspace, activeId, setActiveId, hydrated } =
    useActiveWorkspace(workspacesQuery.data);
  const meQuery = useMe(Boolean(activeWorkspace));
  const membersQuery = useWorkspaceMembers(activeWorkspace?.id ?? null);
  const updateWorkspaceMutation = useUpdateWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const goHome = () => {
    router.navigate("/(tabs)" as never);
  };

  const scrollInviteFieldIntoView = () => {
    inviteFocusedRef.current = true;
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });
  };

  useEffect(() => {
    if (keyboardHeight <= 0) {
      inviteFocusedRef.current = false;
      return;
    }
    if (!inviteFocusedRef.current) return;
    const handle = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(handle);
  }, [keyboardHeight]);

  if (workspacesQuery.isPending || !hydrated) {
    return (
      <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={theme.primary} />
        </View>
      </Screen>
    );
  }

  if (workspacesQuery.isError || !activeWorkspace) {
    return (
      <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
        <View style={{ flex: 1, padding: spacing[6], paddingBottom: tabClearance }}>
          <Text style={{ ...typography.title, color: theme.text }}>
            {t("workspace.title")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.danger,
              marginTop: spacing[4],
            }}
          >
            {t("workspace.loadFailed")}
          </Text>
          <Pressable
            onPress={() => void workspacesQuery.refetch()}
            style={{
              marginTop: spacing[4],
              backgroundColor: theme.primary,
              borderRadius: radius.md,
              paddingVertical: spacing[3],
              alignItems: "center",
            }}
          >
            <Text style={{ ...typography.label, color: "#fff" }}>
              {t("auth.retry")}
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const emoji = getWorkspaceIconEmoji(activeWorkspace.icon) ?? "🏠";

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.bg,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[2],
          }}
        >
          <Pressable
            onPress={goHome}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("auth.back")}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BackIcon size={20} />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ ...typography.headline, color: theme.text }}
            >
              {t("workspace.title")}
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                marginTop: 2,
              }}
            >
              {t("workspace.subtitle")}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing[6],
          paddingTop: spacing[5],
          paddingBottom:
            keyboardHeight > 0
              ? keyboardHeight + spacing[6]
              : tabClearance,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <WorkspaceSummaryCard
          workspace={activeWorkspace}
          emoji={emoji}
          onMenuPress={() => setEditOpen(true)}
        />

        <View
          style={{
            marginTop: spacing[5],
            backgroundColor: theme.section,
            borderRadius: radius.xl,
            paddingVertical: spacing[4],
            paddingLeft: spacing[4],
            paddingRight: spacing[2],
            flexDirection: "row",
            alignItems: "center",
            overflow: "hidden",
            minHeight: 148,
          }}
        >
          <View style={{ flex: 1, paddingRight: spacing[2], zIndex: 1 }}>
            <Text style={{ ...typography.headline, color: theme.text }}>
              {t("workspace.heroTitle")}
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: theme.textBody,
                marginTop: spacing[2],
                lineHeight: 18,
              }}
            >
              {t("workspace.heroBody")}
            </Text>
          </View>
          <Image
            source={brandAssets.workspaceHero}
            style={{
              width: 148,
              height: 128,
              resizeMode: "contain",
              marginRight: -spacing[2],
            }}
            accessibilityLabel=""
          />
        </View>

        <WorkspaceMembersList
          workspaceId={activeWorkspace.id}
          members={membersQuery.data ?? []}
          currentUserId={meQuery.data?.id ?? null}
          actorRole={activeWorkspace.role}
          loading={membersQuery.isPending}
        />

        {activeWorkspace.plan !== "premium" ? (
          <PremiumUpgradeBanner />
        ) : null}

        <WorkspaceInviteSection
          workspaceId={activeWorkspace.id}
          canManage={
            activeWorkspace.role === "owner" ||
            activeWorkspace.role === "admin"
          }
          onEmailFocus={scrollInviteFieldIntoView}
        />

        <WorkspaceSwitcher
          workspaces={workspacesQuery.data ?? []}
          activeId={activeId}
          onSelect={(id) => void setActiveId(id)}
          onCreate={() => setCreateOpen(true)}
        />
      </ScrollView>

      <CreateWorkspaceSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => void setActiveId(id)}
      />

      <EditWorkspaceSheet
        key={editOpen ? activeWorkspace.id : "closed"}
        visible={editOpen}
        workspace={activeWorkspace}
        busy={updateWorkspaceMutation.isPending}
        onClose={() => setEditOpen(false)}
        onSave={(input) => {
          updateWorkspaceMutation.mutate(
            {
              workspaceId: activeWorkspace.id,
              name: input.name,
              icon: input.icon,
            },
            {
              onSuccess: () => setEditOpen(false),
            },
          );
        }}
      />
    </Screen>
  );
}
