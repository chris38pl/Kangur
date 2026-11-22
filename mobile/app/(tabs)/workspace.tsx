import { useAuth } from "@clerk/clerk-expo";
import { getWorkspaceIconEmoji } from "@shared/workspace-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
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
import { openSubscriptionManagement } from "@/features/billing/open-subscription-management";
import { PremiumUpgradeBanner } from "@/features/billing/premium-upgrade-banner";
import { RemoveWorkspaceSheet } from "@/features/workspace/remove-workspace-sheet";
import type { Workspace } from "@/features/workspace/schemas";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useRemoveWorkspace } from "@/features/workspace/useRemoveWorkspace";
import { useUpdateWorkspace } from "@/features/workspace/useUpdateWorkspace";
import {
  describeRemovalFailure,
  isOnlyWorkspace,
  removalModeForRole,
  type SubscriptionProvider,
  type WorkspaceRemovalFailure,
  type WorkspaceRemovalMode,
} from "@/features/workspace/workspace-removal";
import { useWorkspaceMembers } from "@/features/workspace/useWorkspaceMembers";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { WorkspaceInviteSection } from "@/features/workspace/workspace-invite-section";
import { WorkspaceMembersList } from "@/features/workspace/workspace-members-list";
import { WorkspaceSummaryCard } from "@/features/workspace/workspace-summary-card";
import { WorkspaceSwitcher } from "@/features/workspace/workspace-switcher";
import { useKeyboardScroll } from "@/hooks/useKeyboardScroll";
import { useTabBarClearance } from "@/hooks/useSafeAreaLayout";
import { goRoot, showRootBackToast } from "@/lib/navigation";

type RemovalTarget = {
  workspace: Workspace;
  mode: WorkspaceRemovalMode;
};

export default function WorkspaceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const tabClearance = useTabBarClearance();
  const {
    scrollRef,
    onScroll,
    bindFieldFocus,
    setFormBlockRef,
    keyboardHeight,
  } = useKeyboardScroll();
  const emailFieldRef = useRef<View>(null);
  const emailFocus = bindFieldFocus(emailFieldRef);
  const workspacesQuery = useWorkspaces();
  const { activeWorkspace, activeId, setActiveId, hydrated } =
    useActiveWorkspace(workspacesQuery.data);
  const meQuery = useMe(Boolean(activeWorkspace));
  const membersQuery = useWorkspaceMembers(activeWorkspace?.id ?? null);
  const updateWorkspaceMutation = useUpdateWorkspace();
  const removeWorkspaceMutation = useRemoveWorkspace({ setActiveId });
  const { getToken } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  // Snapshot at open: the active workspace changes as soon as removal succeeds.
  const [removal, setRemoval] = useState<RemovalTarget | null>(null);
  const [removalFailure, setRemovalFailure] =
    useState<WorkspaceRemovalFailure | null>(null);

  const goHome = () => {
    goRoot();
  };

  const closeRemoval = () => {
    if (removeWorkspaceMutation.isPending) return;
    setRemoval(null);
    setRemovalFailure(null);
  };

  const openRemoval = (workspace: Workspace) => {
    const mode = removalModeForRole(workspace.role);
    // The server refuses this too; skip a confirm that cannot succeed.
    setRemovalFailure(
      mode === "delete" && isOnlyWorkspace(workspacesQuery.data, workspace.id)
        ? { kind: "last_workspace" }
        : null,
    );
    setRemoval({ workspace, mode });
  };

  const confirmRemoval = () => {
    if (!removal) return;
    const { workspace, mode } = removal;
    setRemovalFailure(null);
    removeWorkspaceMutation.mutate(
      { workspaceId: workspace.id, mode },
      {
        onSuccess: ({ alreadyGone }) => {
          setRemoval(null);
          showRootBackToast(
            alreadyGone
              ? t("workspace.alreadyGoneToast")
              : mode === "delete"
                ? t("workspace.deletedToast", { name: workspace.name })
                : t("workspace.leftToast", { name: workspace.name }),
          );
        },
        onError: (error) => {
          setRemovalFailure(describeRemovalFailure(error));
        },
      },
    );
  };

  const manageSubscription = (provider: SubscriptionProvider | null) => {
    const workspaceId = removal?.workspace.id;
    setRemoval(null);
    setRemovalFailure(null);
    if (!provider || !workspaceId) {
      router.push("/premium");
      return;
    }
    void openSubscriptionManagement({ provider, workspaceId, getToken }).catch(
      (error: unknown) => {
        console.info("[workspace]", "ManageSubscriptionFailed", error);
        router.push("/premium");
      },
    );
  };

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
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: spacing[6],
          paddingTop: spacing[5],
          paddingBottom:
            keyboardHeight > 0
              ? keyboardHeight + spacing[10]
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
          <PremiumUpgradeBanner
            onPress={() => router.push("/premium")}
          />
        ) : null}

        <WorkspaceInviteSection
          workspaceId={activeWorkspace.id}
          canManage={
            activeWorkspace.role === "owner" ||
            activeWorkspace.role === "admin"
          }
          emailFieldRef={emailFieldRef}
          emailFocus={emailFocus}
          formBlockRef={setFormBlockRef}
        />

        <WorkspaceSwitcher
          workspaces={workspacesQuery.data ?? []}
          activeId={activeId}
          onSelect={(id) => void setActiveId(id)}
          onCreate={() => setCreateOpen(true)}
        />

        <Pressable
          onPress={() => openRemoval(activeWorkspace)}
          accessibilityRole="button"
          accessibilityLabel={
            activeWorkspace.role === "owner"
              ? t("workspace.deleteAction")
              : t("workspace.leaveAction")
          }
          style={{
            marginTop: spacing[8],
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ ...typography.label, color: theme.danger }}>
            {activeWorkspace.role === "owner"
              ? t("workspace.deleteAction")
              : t("workspace.leaveAction")}
          </Text>
        </Pressable>
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

      {removal ? (
        <RemoveWorkspaceSheet
          visible
          mode={removal.mode}
          workspace={removal.workspace}
          busy={removeWorkspaceMutation.isPending}
          failure={removalFailure}
          onCancel={closeRemoval}
          onConfirm={confirmRemoval}
          onManageSubscription={manageSubscription}
        />
      ) : null}
    </Screen>
  );
}
