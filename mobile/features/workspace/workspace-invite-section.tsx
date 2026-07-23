import { useState, type RefObject } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { ApiClientError } from "@/lib/api/client";

import { RevokeInviteSheet } from "./revoke-invite-sheet";
import { InviteSentSheet } from "./invite-sent-sheet";
import type { Invitation } from "./schemas";
import {
  useCreateInvitation,
  useRevokeInvitation,
  useWorkspaceInvitations,
} from "./useWorkspaceInvites";

type FieldFocusHandlers = {
  onFocus: () => void;
  onBlur: () => void;
};

type Props = {
  workspaceId: string;
  canManage: boolean;
  /** Keep invite email + send CTA above the keyboard (same pattern as auth). */
  emailFieldRef?: RefObject<View | null>;
  emailFocus?: FieldFocusHandlers;
  formBlockRef?: (node: View | null) => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WorkspaceInviteSection({
  workspaceId,
  canManage,
  emailFieldRef,
  emailFocus,
  formBlockRef,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const [email, setEmail] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null);
  const [sentSheet, setSentSheet] = useState<{
    email: string;
    resent: boolean;
  } | null>(null);

  const invitationsQuery = useWorkspaceInvitations(workspaceId, canManage);
  const createMutation = useCreateInvitation(workspaceId);
  const revokeMutation = useRevokeInvitation(workspaceId);

  if (!canManage) {
    return null;
  }

  const sendInvite = () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      Alert.alert(t("workspace.inviteInvalidEmail"));
      return;
    }

    createMutation.mutate(trimmed, {
      onSuccess: (result) => {
        setEmail("");
        setSentSheet({
          email: trimmed,
          resent: result.status === "resent",
        });
      },
      onError: (err) => {
        if (err instanceof ApiClientError) {
          if (err.status === 409) {
            Alert.alert(t("workspace.inviteAlreadyMember"));
            return;
          }
          if (err.status === 400) {
            Alert.alert(err.message || t("workspace.inviteInvalidEmail"));
            return;
          }
          if (err.status === 403) {
            Alert.alert(t("workspace.inviteForbidden"));
            return;
          }
        }
        Alert.alert(t("workspace.inviteFailed"));
      },
    });
  };

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

  const fieldStyle = {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: Platform.OS === "ios" ? spacing[3] : spacing[2] + 2,
    color: theme.text,
    ...typography.body,
  } as const;

  const pending = invitationsQuery.data ?? [];

  return (
    <View style={{ marginTop: spacing[6] }}>
      <Text style={{ ...typography.headline, color: theme.text }}>
        {t("workspace.inviteTitle")}
      </Text>

      <View ref={formBlockRef} collapsable={false}>
        <View
          ref={emailFieldRef}
          collapsable={false}
          style={{ marginTop: spacing[3] }}
        >
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t("workspace.inviteEmailPlaceholder")}
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            onFocus={emailFocus?.onFocus}
            onBlur={emailFocus?.onBlur}
            style={fieldStyle}
          />
        </View>

        <Pressable
          onPress={sendInvite}
          disabled={createMutation.isPending}
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
            opacity: createMutation.isPending ? 0.7 : 1,
          }}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color={theme.onPrimary} />
          ) : (
            <>
              <Text style={{ fontSize: 16, color: theme.onPrimary }}>✈️</Text>
              <Text style={{ ...typography.label, color: theme.onPrimary }}>
                {t("workspace.inviteSend")}
              </Text>
            </>
          )}
        </Pressable>
      </View>

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
                  {invitation.email}
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
        email={revokeTarget?.email ?? ""}
        busy={revokeMutation.isPending}
        onCancel={() => {
          if (!revokeMutation.isPending) setRevokeTarget(null);
        }}
        onConfirm={confirmRevoke}
      />

      <InviteSentSheet
        visible={sentSheet != null}
        email={sentSheet?.email ?? ""}
        resent={sentSheet?.resent ?? false}
        onClose={() => setSentSheet(null)}
      />
    </View>
  );
}
