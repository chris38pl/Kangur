import { getWorkspaceIconEmoji } from "@shared/workspace-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { CreateWorkspaceSheet } from "@/features/workspace/create-workspace-sheet";
import { AiCreditsBadge } from "@/features/billing/ai-credits-badge";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { WorkspaceSwitcher } from "@/features/workspace/workspace-switcher";

export default function WorkspaceScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const workspacesQuery = useWorkspaces();
  const { activeWorkspace, activeId, setActiveId, hydrated } =
    useActiveWorkspace(workspacesQuery.data);
  const [createOpen, setCreateOpen] = useState(false);

  if (workspacesQuery.isPending || !hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.bg,
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (workspacesQuery.isError || !activeWorkspace) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, padding: spacing[6] }}>
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
    );
  }

  const emoji = getWorkspaceIconEmoji(activeWorkspace.icon) ?? "🏠";
  const planLabel =
    activeWorkspace.plan === "premium"
      ? t("workspace.planPremium")
      : t("workspace.planFree");

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.section, padding: spacing[6] }}
    >
      <Text style={{ ...typography.title, color: theme.text }}>
        {t("workspace.title")}
      </Text>

      <View
        style={{
          marginTop: spacing[6],
          padding: spacing[5],
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surface,
        }}
      >
        <Text style={{ fontSize: 40 }}>{emoji}</Text>
        <Text
          style={{
            ...typography.headline,
            color: theme.text,
            marginTop: spacing[2],
          }}
        >
          {activeWorkspace.name}
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: theme.textMuted,
            marginTop: spacing[1],
          }}
        >
          {planLabel}
          {" · "}
          {t("workspace.members", { count: activeWorkspace.memberCount })}
          {activeWorkspace.isOwner ? ` · ${t("workspace.owner")}` : ""}
        </Text>
        <AiCreditsBadge workspaceId={activeWorkspace.id} />
      </View>

      <WorkspaceSwitcher
        workspaces={workspacesQuery.data ?? []}
        activeId={activeId}
        onSelect={(id) => void setActiveId(id)}
      />

      <Pressable
        onPress={() => setCreateOpen(true)}
        style={{
          marginTop: spacing[8],
          backgroundColor: theme.primary,
          borderRadius: radius.md,
          paddingVertical: spacing[4],
          alignItems: "center",
        }}
      >
        <Text style={{ ...typography.label, color: theme.onPrimary }}>
          {t("workspace.create")}
        </Text>
      </Pressable>

      <CreateWorkspaceSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => void setActiveId(id)}
      />
    </View>
  );
}
