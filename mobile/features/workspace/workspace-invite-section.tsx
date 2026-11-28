import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { intlLocaleTag } from "@/lib/i18n/locales";

import { InviteSheet } from "./invite-sheet";
import { RevokeInviteSheet } from "./revoke-invite-sheet";
import type { Invitation } from "./schemas";
import {
  useRevokeInvitation,
  useWorkspaceInvitations,
} from "./useWorkspaceInvites";

type Props = {
  workspace: { id: string; name: string };
  canManage: boolean;
};

function formatDay(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(intlLocaleTag(locale), {
      day: "numeric",
      month: "long",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

/** "Invite" for owners and admins, and the invitations that still wait. */
export function WorkspaceInviteSection({ workspace, canManage }: Props) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const [sheetOpen, setSheetOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null);

  const invitationsQuery = useWorkspaceInvitations(workspace.id, canManage);
  const revokeMutation = useRevokeInvitation(workspace.id);

  if (!canManage) {
    return null;
  }

  const confirmRevoke = () => {
    if (!revokeTarget) return;
    const invitationId = revokeTarget.id;
    revokeMutation.mutate(invitationId, {
      onSuccess: () => setRevokeTarget(null),
      onError: () => {
        Alert.alert(t("workspace.revokeInviteFailed"));
      },
    });
  };

  const pending = invitationsQuery.data ?? [];
  const labelOf = (invitation: Invitation) =>
    invitation.kind === "link" || !invitation.email
      ? t("workspace.pendingLink", { date: formatDay(invitation.expiresAt, i18n.language) })
      : invitation.email;

  return (
    <View style={{ marginTop: spacing[6] }}>
      <Text style={{ ...typography.headline, color: theme.text }}>
        {t("workspace.inviteTitle")}
      </Text>
      <Text style={{ ...typography.caption, color: theme.textMuted, marginTop: spacing[1] }}>
        {t("workspace.inviteLead")}
      </Text>

      <Pressable
        onPress={() => setSheetOpen(true)}
        accessibilityRole="button"
        style={{
          marginTop: spacing[3],
          backgroundColor: theme.primary,
          borderRadius: radius.md,
          paddingVertical: spacing[4],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing[2],
        }}
      >
        <Text style={{ fontSize: 16, color: theme.onPrimary }}>✈️</Text>
        <Text style={{ ...typography.label, color: theme.onPrimary }}>
          {t("workspace.inviteButton")}
        </Text>
      </Pressable>

      {pending.length > 0 ? (
        <View style={{ marginTop: spacing[5] }}>
          <Text style={{ ...typography.headline, color: theme.text }}>
            {t("workspace.pendingInvitesTitle")}
          </Text>
          <View style={{ marginTop: spacing[2], gap: spacing[2] }}>
            {pending.map((invitation) => (
              <View
                key={invitation.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[3],
                  paddingVertical: spacing[2],
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    ...typography.body,
                    color: theme.text,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {labelOf(invitation)}
                </Text>
                <Pressable
                  onPress={() => setRevokeTarget(invitation)}
                  hitSlop={6}
                  accessibilityRole="button"
                  style={{
                    backgroundColor: "#FDECEC",
                    borderRadius: radius.full,
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[1] + 2,
                  }}
                >
                  <Text
                    style={{
                      ...typography.caption,
                      color: theme.danger,
                      fontWeight: "700",
                    }}
                  >
                    {t("workspace.revokeInviteConfirm")}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <RevokeInviteSheet
        visible={revokeTarget != null}
        body={
          revokeTarget?.kind === "link" || !revokeTarget?.email
            ? t("workspace.revokeLinkBody")
            : t("workspace.revokeInviteBody", { email: revokeTarget.email })
        }
        busy={revokeMutation.isPending}
        onCancel={() => {
          if (!revokeMutation.isPending) setRevokeTarget(null);
        }}
        onConfirm={confirmRevoke}
      />

      <InviteSheet
        visible={sheetOpen}
        workspace={workspace}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}
