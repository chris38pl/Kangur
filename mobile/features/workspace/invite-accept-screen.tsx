import { getWorkspaceIconEmoji } from "@shared/workspace-icons";
import { useAuth, useClerk } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { formatNotificationTime } from "@/features/notifications/format-time";
import {
  listNotifications,
  markNotificationRead,
} from "@/features/notifications/api";
import {
  acceptInvitation,
  previewInvitation,
} from "@/features/workspace/api";
import type { InvitationPreview } from "@/features/workspace/schemas";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { ApiClientError } from "@/lib/api/client";

type ViewState =
  | { kind: "loading" }
  | { kind: "need_auth" }
  | {
      kind: "mismatch";
      invitationEmail: string;
      currentEmail: string;
      provider: string;
    }
  | { kind: "expired" }
  | { kind: "preview"; preview: InvitationPreview }
  | {
      kind: "already";
      workspace: { id: string; name: string; icon: string };
    }
  | {
      kind: "success";
      workspace: { id: string; name: string; icon: string };
    }
  | { kind: "error"; message: string }
  | { kind: "joining"; preview: InvitationPreview };

const AVATAR_PALETTE = [
  { background: "#FDECEC", text: "#C45C5C" },
  { background: "#EAF7F2", text: "#2F8F84" },
  { background: "#EEEAF8", text: "#7B6BC9" },
  { background: "#FFF1E6", text: "#D4783A" },
  { background: "#E8F2FB", text: "#4A7FB5" },
] as const;

const MAX_AVATARS = 3;
const HEADER_SIDE = 40;

function avatarColors(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATAR_PALETTE.length;
  }
  return AVATAR_PALETTE[hash] ?? AVATAR_PALETTE[0];
}

function providerLabel(provider: string, t: (key: string) => string): string {
  if (provider === "google") return t("invite.providerGoogle");
  if (provider === "apple") return t("invite.providerApple");
  return t("invite.providerEmail");
}

export function InviteAcceptScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const params = useLocalSearchParams<{
    token?: string | string[];
    notificationId?: string | string[];
  }>();
  const rawToken = Array.isArray(params.token)
    ? (params.token[0] ?? "")
    : typeof params.token === "string"
      ? params.token
      : "";
  const notificationIdParam = Array.isArray(params.notificationId)
    ? (params.notificationId[0] ?? "")
    : typeof params.notificationId === "string"
      ? params.notificationId
      : "";
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const workspacesQuery = useWorkspaces();
  const { setActiveId } = useActiveWorkspace(workspacesQuery.data);

  const [state, setState] = useState<ViewState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!rawToken.trim()) {
        if (!cancelled) setState({ kind: "expired" });
        return;
      }
      if (!isLoaded) return;
      if (!isSignedIn) {
        if (!cancelled) setState({ kind: "need_auth" });
        return;
      }

      if (!cancelled) setState({ kind: "loading" });
      try {
        const token = await getToken();
        if (cancelled) return;
        if (!token) {
          setState({ kind: "need_auth" });
          return;
        }
        const preview = await previewInvitation(token, rawToken);
        if (cancelled) return;
        if (preview.alreadyMember) {
          setState({ kind: "already", workspace: preview.workspace });
          return;
        }
        setState({ kind: "preview", preview });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiClientError) {
          const reason = err.details?.reason;
          if (reason === "email_mismatch") {
            setState({
              kind: "mismatch",
              invitationEmail: String(err.details?.invitationEmail ?? ""),
              currentEmail: String(err.details?.currentEmail ?? ""),
              provider: String(err.details?.provider ?? "email"),
            });
            return;
          }
          if (
            reason === "expired" ||
            reason === "revoked" ||
            err.status === 404
          ) {
            setState({ kind: "expired" });
            return;
          }
          setState({ kind: "error", message: err.message });
          return;
        }
        setState({ kind: "error", message: t("invite.unknownError") });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    // getToken / t are unstable on web - do not depend on them or we loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [rawToken, isLoaded, isSignedIn]);

  const reloadPreview = useCallback(() => {
    setState({ kind: "loading" });
    void (async () => {
      if (!rawToken.trim()) {
        setState({ kind: "expired" });
        return;
      }
      if (!isSignedIn) {
        setState({ kind: "need_auth" });
        return;
      }
      try {
        const token = await getToken();
        if (!token) {
          setState({ kind: "need_auth" });
          return;
        }
        const preview = await previewInvitation(token, rawToken);
        if (preview.alreadyMember) {
          setState({ kind: "already", workspace: preview.workspace });
          return;
        }
        setState({ kind: "preview", preview });
      } catch (err) {
        if (err instanceof ApiClientError) {
          setState({ kind: "error", message: err.message });
          return;
        }
        setState({ kind: "error", message: t("invite.unknownError") });
      }
    })();
  }, [rawToken, isSignedIn, getToken, t]);

  const openWorkspace = async (workspaceId: string) => {
    if (workspaceId) {
      await setActiveId(workspaceId);
    }
    router.replace("/(tabs)" as never);
  };

  const goAuth = () => {
    router.replace({
      pathname: "/(auth)/sign-in",
      params: { redirect: `/invite/${rawToken}` },
    } as never);
  };

  const switchAccount = async () => {
    await signOut();
    goAuth();
  };

  const markInviteNotificationRead = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      let notificationId = notificationIdParam.trim();
      if (!notificationId) {
        const list = await listNotifications(token);
        const match = list.notifications.find((n) => {
          if (n.type !== "WORKSPACE_INVITATION") return false;
          const payload = (n.payload ?? {}) as Record<string, unknown>;
          return payload.token === rawToken;
        });
        notificationId = match?.id ?? "";
      }
      if (!notificationId) return;

      await markNotificationRead(token, notificationId);
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      // Best-effort: leaving without accept must not block Home navigation.
    }
  }, [getToken, notificationIdParam, rawToken, queryClient]);

  /** Leave without accepting: Home + mark notification read. */
  const dismissWithoutAccept = useCallback(() => {
    void markInviteNotificationRead();
    router.replace("/(tabs)" as never);
  }, [markInviteNotificationRead, router]);

  const onJoin = async (preview: InvitationPreview) => {
    setState({ kind: "joining", preview });
    try {
      const token = await getToken();
      if (!token) {
        setState({ kind: "need_auth" });
        return;
      }
      const result = await acceptInvitation(token, rawToken);
      void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      void queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      if (result.alreadyMember) {
        setState({ kind: "already", workspace: result.workspace });
      } else {
        setState({ kind: "success", workspace: result.workspace });
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        const reason = err.details?.reason;
        if (reason === "email_mismatch") {
          setState({
            kind: "mismatch",
            invitationEmail: String(err.details?.invitationEmail ?? ""),
            currentEmail: String(err.details?.currentEmail ?? ""),
            provider: String(err.details?.provider ?? "email"),
          });
          return;
        }
        if (
          reason === "expired" ||
          reason === "revoked" ||
          err.status === 404
        ) {
          setState({ kind: "expired" });
          return;
        }
        if (reason === "already_member" || reason === "already_accepted") {
          setState({
            kind: "already",
            workspace: {
              id: String(err.details?.workspaceId ?? preview.workspace.id),
              name: String(
                err.details?.workspaceName ?? preview.workspace.name,
              ),
              icon: String(
                err.details?.workspaceIcon ?? preview.workspace.icon,
              ),
            },
          });
          return;
        }
        setState({ kind: "error", message: err.message });
        return;
      }
      setState({ kind: "error", message: t("invite.unknownError") });
    }
  };

  const pillPrimary = {
    backgroundColor: theme.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: "center" as const,
  };

  const showChrome =
    state.kind === "preview" ||
    state.kind === "joining" ||
    state.kind === "success" ||
    state.kind === "already";

  return (
    <Screen style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[2],
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={dismissWithoutAccept}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("invite.goHome")}
          style={{
            width: HEADER_SIDE,
            height: HEADER_SIDE,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BackIcon size={20} />
        </Pressable>
      </View>

      {state.kind === "loading" ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : null}

      {state.kind === "need_auth" ? (
        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing[6],
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={brandAssets.inviteWelcome}
            style={{ width: 200, height: 200, resizeMode: "contain" }}
            accessibilityLabel=""
          />
          <Text
            style={{
              ...typography.title,
              color: theme.text,
              textAlign: "center",
              marginTop: spacing[5],
            }}
          >
            {t("invite.needAuthTitle")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              textAlign: "center",
              marginTop: spacing[3],
            }}
          >
            {t("invite.needAuthBody")}
          </Text>
          <Pressable
            onPress={goAuth}
            style={{
              ...pillPrimary,
              marginTop: spacing[6],
              alignSelf: "stretch",
            }}
          >
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("invite.signIn")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {state.kind === "mismatch" ? (
        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing[6],
            justifyContent: "center",
          }}
        >
          <Text style={{ ...typography.title, color: theme.text }}>
            {t("invite.mismatchTitle")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              marginTop: spacing[4],
            }}
          >
            {t("invite.mismatchBelongsTo", {
              email: state.invitationEmail,
            })}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              marginTop: spacing[2],
            }}
          >
            {t("invite.mismatchLoggedIn", {
              email: state.currentEmail,
              provider: providerLabel(state.provider, t),
            })}
          </Text>
          <Pressable
            onPress={() => void switchAccount()}
            style={{ ...pillPrimary, marginTop: spacing[6] }}
          >
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("invite.switchAccount")}
            </Text>
          </Pressable>
          <Pressable onPress={dismissWithoutAccept} style={{ marginTop: spacing[4] }}>
            <Text
              style={{
                ...typography.label,
                color: theme.text,
                textAlign: "center",
              }}
            >
              {t("invite.cancel")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {state.kind === "expired" ? (
        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing[6],
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              ...typography.title,
              color: theme.text,
              textAlign: "center",
            }}
          >
            {t("invite.expiredTitle")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              textAlign: "center",
              marginTop: spacing[3],
            }}
          >
            {t("invite.expiredBody")}
          </Text>
          <Pressable
            onPress={dismissWithoutAccept}
            style={{
              ...pillPrimary,
              marginTop: spacing[6],
              alignSelf: "stretch",
            }}
          >
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("invite.goHome")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {state.kind === "error" ? (
        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing[6],
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              ...typography.title,
              color: theme.text,
              textAlign: "center",
            }}
          >
            {t("invite.errorTitle")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.danger,
              textAlign: "center",
              marginTop: spacing[3],
            }}
          >
            {state.message}
          </Text>
          <Pressable
            onPress={reloadPreview}
            style={{
              ...pillPrimary,
              marginTop: spacing[6],
              alignSelf: "stretch",
            }}
          >
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("auth.retry")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {showChrome &&
      (state.kind === "preview" ||
        state.kind === "joining" ||
        state.kind === "success" ||
        state.kind === "already") ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing[6],
            paddingBottom: spacing[6] + insets.bottom,
            alignItems: "center",
            flexGrow: 1,
          }}
        >
          {(state.kind === "preview" || state.kind === "joining") && (
            <InvitePreviewBody
              preview={state.preview}
              locale={i18n.language}
              joining={state.kind === "joining"}
              onJoin={() => void onJoin(state.preview)}
              onDecline={dismissWithoutAccept}
            />
          )}

          {state.kind === "success" ? (
            <View style={{ alignItems: "center", marginTop: spacing[8] }}>
              <Image
                source={brandAssets.inviteWelcome}
                style={{ width: 200, height: 200, resizeMode: "contain" }}
                accessibilityLabel=""
              />
              <Text
                style={{
                  ...typography.title,
                  color: theme.text,
                  textAlign: "center",
                  marginTop: spacing[4],
                }}
              >
                {t("invite.successTitle")}
              </Text>
              <Text
                style={{
                  ...typography.body,
                  color: theme.textBody,
                  textAlign: "center",
                  marginTop: spacing[3],
                }}
              >
                {t("invite.successBody")}
              </Text>
              <Pressable
                onPress={() => void openWorkspace(state.workspace.id)}
                style={{
                  ...pillPrimary,
                  marginTop: spacing[6],
                  alignSelf: "stretch",
                  minWidth: "100%",
                }}
              >
                <Text style={{ ...typography.label, color: theme.onPrimary }}>
                  {t("invite.openWorkspace")}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {state.kind === "already" ? (
            <View style={{ alignItems: "center", marginTop: spacing[8] }}>
              <Image
                source={brandAssets.inviteWelcome}
                style={{ width: 200, height: 200, resizeMode: "contain" }}
                accessibilityLabel=""
              />
              <Text
                style={{
                  ...typography.title,
                  color: theme.text,
                  textAlign: "center",
                  marginTop: spacing[4],
                }}
              >
                {t("invite.alreadyTitle")}
              </Text>
              <Text
                style={{
                  ...typography.body,
                  color: theme.textBody,
                  textAlign: "center",
                  marginTop: spacing[3],
                }}
              >
                {t("invite.alreadyBody", {
                  workspace: state.workspace.name || t("invite.thisWorkspace"),
                })}
              </Text>
              <Pressable
                onPress={() => void openWorkspace(state.workspace.id)}
                style={{
                  ...pillPrimary,
                  marginTop: spacing[6],
                  alignSelf: "stretch",
                  minWidth: "100%",
                }}
              >
                <Text style={{ ...typography.label, color: theme.onPrimary }}>
                  {t("invite.openWorkspace")}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </Screen>
  );
}

function InvitePreviewBody({
  preview,
  locale,
  joining,
  onJoin,
  onDecline,
}: {
  preview: InvitationPreview;
  locale: string;
  joining: boolean;
  onJoin: () => void;
  onDecline: () => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const emoji = getWorkspaceIconEmoji(preview.workspace.icon) ?? "🏠";
  const visible = preview.members.slice(0, MAX_AVATARS);
  const overflow = Math.max(0, preview.memberCount - MAX_AVATARS);

  return (
    <View style={{ width: "100%", alignItems: "center", paddingTop: spacing[2] }}>
      <Image
        source={brandAssets.inviteWelcome}
        style={{ width: 220, height: 220, resizeMode: "contain" }}
        accessibilityLabel=""
      />

      <View
        style={{
          marginTop: spacing[3],
          backgroundColor: theme.section,
          borderRadius: radius.full,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[1] + 2,
        }}
      >
        <Text style={{ ...typography.caption, color: theme.textBody }}>
          {formatNotificationTime(preview.createdAt, locale)}
        </Text>
      </View>

      <Text
        style={{
          ...typography.title,
          fontSize: 22,
          lineHeight: 30,
          color: theme.text,
          textAlign: "center",
          marginTop: spacing[4],
          paddingHorizontal: spacing[2],
        }}
      >
        {t("invite.headline", {
          name: preview.inviterDisplayName,
          workspace: preview.workspace.name,
        })}
      </Text>

      <View
        style={{
          width: "100%",
          marginTop: spacing[5],
          backgroundColor: theme.section,
          borderRadius: radius.xl,
          padding: spacing[4],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[3],
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.sm,
              backgroundColor: theme.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 22 }}>{emoji}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ ...typography.headline, color: theme.text }}
              numberOfLines={1}
            >
              {preview.workspace.name}
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                marginTop: 2,
              }}
            >
              {t("invite.memberCount", { count: preview.memberCount })}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {visible.map((member, index) => {
              const initial = (
                member.displayName.trim()[0] ?? "?"
              ).toUpperCase();
              const colorsFor = avatarColors(member.userId);
              return (
                <View
                  key={member.userId}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colorsFor.background,
                    borderWidth: 2,
                    borderColor: theme.section,
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: index === 0 ? 0 : -8,
                    zIndex: visible.length - index,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: colorsFor.text,
                    }}
                  >
                    {initial}
                  </Text>
                </View>
              );
            })}
            {overflow > 0 ? (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: theme.surface,
                  borderWidth: 2,
                  borderColor: theme.section,
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: -8,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: theme.textMuted,
                  }}
                >
                  +{overflow}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <Text
        style={{
          ...typography.body,
          color: theme.textBody,
          textAlign: "center",
          marginTop: spacing[5],
          lineHeight: 24,
          paddingHorizontal: spacing[2],
        }}
      >
        {t("invite.previewBody")}
      </Text>

      <Pressable
        onPress={onJoin}
        disabled={joining}
        style={{
          marginTop: spacing[8],
          alignSelf: "stretch",
          backgroundColor: theme.primary,
          borderRadius: radius.full,
          paddingVertical: spacing[4],
          alignItems: "center",
          opacity: joining ? 0.7 : 1,
        }}
      >
        {joining ? (
          <ActivityIndicator color={theme.onPrimary} />
        ) : (
          <Text style={{ ...typography.label, color: theme.onPrimary }}>
            {t("invite.join")}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={onDecline}
        disabled={joining}
        hitSlop={8}
        style={{ marginTop: spacing[4], paddingVertical: spacing[2] }}
      >
        <Text
          style={{
            ...typography.label,
            color: theme.danger,
            textAlign: "center",
          }}
        >
          {t("invite.decline")}
        </Text>
      </Pressable>
    </View>
  );
}
