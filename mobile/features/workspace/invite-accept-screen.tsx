import { getWorkspaceIconEmoji } from "@shared/workspace-icons";
import { useAuth, useClerk } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
import { useMe } from "@/features/auth/useMe";
import { formatNotificationTime } from "@/features/notifications/format-time";
import {
  listNotifications,
  markNotificationRead,
} from "@/features/notifications/api";
import { clearLocalUserData } from "@/features/profile/clearLocalUserData";
import { nameProblem, normalizeNameInput } from "@/features/profile/display-name";
import { NameAsLine } from "@/features/profile/name-as-line";
import { NameField } from "@/features/profile/name-field";
import { useUpdateDisplayName } from "@/features/profile/useUpdateDisplayName";
import {
  acceptInvitation,
  previewInvitation,
} from "@/features/workspace/api";
import type { InvitationPreview } from "@/features/workspace/schemas";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { Analytics } from "@/lib/analytics";
import { ApiClientError } from "@/lib/api/client";
import {
  clearPendingInvite,
  rememberInviteForSignIn,
} from "@/lib/invite/pending-invite";
import { isValidInviteRawToken } from "@/lib/invite/token";
import {
  completeInviteTask,
  dismissInviteTask,
} from "@/features/workspace/invite-task-intent";

type WorkspaceRef = { id: string; name: string; icon: string };

type ViewState =
  | { kind: "loading" }
  | { kind: "need_auth" }
  /** Opened by id from a notification, and the address belongs to another account. */
  | { kind: "wrong_account" }
  | { kind: "expired" }
  /** Someone already joined with this one-time link. */
  | { kind: "used" }
  | { kind: "preview"; preview: InvitationPreview }
  | { kind: "already"; workspace: WorkspaceRef }
  | { kind: "success"; workspace: WorkspaceRef }
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

/** What the server said, as a screen. The app never shows an address it got in an error. */
function stateForError(
  error: unknown,
  fallback: string,
  preview?: InvitationPreview,
): ViewState {
  if (!(error instanceof ApiClientError)) return { kind: "error", message: fallback };
  const reason = error.details?.reason;
  if (reason === "email_mismatch") return { kind: "wrong_account" };
  if (reason === "used") return { kind: "used" };
  if (reason === "expired" || reason === "revoked" || error.status === 404) {
    return { kind: "expired" };
  }
  if (reason === "already_member" || reason === "already_accepted") {
    return {
      kind: "already",
      workspace: {
        id: String(error.details?.workspaceId ?? preview?.workspace.id ?? ""),
        name: String(error.details?.workspaceName ?? preview?.workspace.name ?? ""),
        icon: String(error.details?.workspaceIcon ?? preview?.workspace.icon ?? ""),
      },
    };
  }
  return { kind: "error", message: error.message || fallback };
}

export function InviteAcceptScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const params = useLocalSearchParams<{
    token?: string | string[];
    invitationId?: string | string[];
    notificationId?: string | string[];
  }>();
  const rawToken = Array.isArray(params.token)
    ? (params.token[0] ?? "")
    : typeof params.token === "string"
      ? params.token
      : "";
  const invitationIdParam = Array.isArray(params.invitationId)
    ? (params.invitationId[0] ?? "")
    : typeof params.invitationId === "string"
      ? params.invitationId
      : "";
  const inviteToken =
    rawToken.trim().length > 0 && isValidInviteRawToken(rawToken.trim())
      ? rawToken.trim()
      : "";
  const invitationId = invitationIdParam.trim();
  const inviteCapability =
    invitationId.length > 0
      ? ({ invitationId } as const)
      : inviteToken.length > 0
        ? ({ inviteToken } as const)
        : null;
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
  const me = useMe(Boolean(isSignedIn));
  const nameMutation = useUpdateDisplayName("join");

  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const skippedName = useRef(false);

  const authRedirectPath =
    inviteCapability && "invitationId" in inviteCapability
      ? `/invite/id/${inviteCapability.invitationId}`
      : inviteCapability && "inviteToken" in inviteCapability
        ? `/invite/${inviteCapability.inviteToken}`
        : "/(tabs)";

  useEffect(() => {
    // Back from sign-in: the way back has done its job.
    if (isSignedIn) clearPendingInvite();
  }, [isSignedIn]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!inviteCapability) {
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
        const preview = await previewInvitation(token, inviteCapability);
        if (cancelled) return;
        if (preview.alreadyMember) {
          setState({ kind: "already", workspace: preview.workspace });
          return;
        }
        setState({ kind: "preview", preview });
      } catch (err) {
        if (cancelled) return;
        setState(stateForError(err, t("invite.unknownError")));
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    // getToken / t are unstable on web - do not depend on them or we loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [inviteToken, invitationId, isLoaded, isSignedIn]);

  const myName = me.data?.displayName ?? null;
  const askForName = state.kind === "preview" && me.isSuccess && !myName;
  useEffect(() => {
    if (askForName) Analytics.track("name_prompt_shown", { place: "join" });
  }, [askForName]);

  const reloadPreview = useCallback(() => {
    setState({ kind: "loading" });
    void (async () => {
      if (!inviteCapability) {
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
        const preview = await previewInvitation(token, inviteCapability);
        if (preview.alreadyMember) {
          setState({ kind: "already", workspace: preview.workspace });
          return;
        }
        setState({ kind: "preview", preview });
      } catch (err) {
        setState(stateForError(err, t("invite.unknownError")));
      }
    })();
  }, [inviteCapability, inviteToken, invitationId, isSignedIn, getToken, t]);

  const openWorkspace = async (workspaceId: string) => {
    if (workspaceId) {
      await setActiveId(workspaceId);
    }
    completeInviteTask();
  };

  const goAuth = () => {
    rememberInviteForSignIn(authRedirectPath);
    router.replace({
      pathname: "/(auth)/sign-in",
      params: { redirect: authRedirectPath },
    } as never);
  };

  const switchAccount = async () => {
    await clearLocalUserData(queryClient);
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
          if (
            inviteCapability &&
            "invitationId" in inviteCapability &&
            payload.invitationId === inviteCapability.invitationId
          ) {
            return true;
          }
          if (
            inviteCapability &&
            "inviteToken" in inviteCapability &&
            payload.token === inviteCapability.inviteToken
          ) {
            return true;
          }
          return false;
        });
        notificationId = match?.id ?? "";
      }
      if (!notificationId) return;

      await markNotificationRead(token, notificationId);
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      // Best-effort: leaving without accept must not block Home navigation.
    }
  }, [getToken, notificationIdParam, inviteToken, invitationId, queryClient]);

  /** Leave without accepting: Home + mark notification read. */
  const dismissWithoutAccept = useCallback(() => {
    void markInviteNotificationRead();
    dismissInviteTask();
  }, [markInviteNotificationRead]);

  /** A name typed on this screen is saved first; false keeps the person here to fix it. */
  const saveTypedName = async (): Promise<boolean> => {
    const showsField = !myName || editingName;
    if (!showsField) return true;
    const draft = normalizeNameInput(nameDraft);
    if (!draft) {
      if (!myName && !skippedName.current) {
        skippedName.current = true;
        Analytics.track("name_skipped", { place: "join" });
      }
      return true;
    }
    const problem = nameProblem(draft);
    if (problem) {
      setNameError(problem === "email" ? t("name.notEmail") : t("name.tooLong"));
      return false;
    }
    if (draft === myName) return true;
    try {
      await nameMutation.mutateAsync(draft);
      setEditingName(false);
      return true;
    } catch (failure) {
      const reason = failure instanceof ApiClientError ? failure.details?.reason : null;
      setNameError(reason === "name_email" ? t("name.notEmail") : t("name.saveFailed"));
      return false;
    }
  };

  const onJoin = async (preview: InvitationPreview) => {
    setState({ kind: "joining", preview });
    if (!(await saveTypedName())) {
      setState({ kind: "preview", preview });
      return;
    }
    try {
      const token = await getToken();
      if (!token) {
        setState({ kind: "need_auth" });
        return;
      }
      if (!inviteCapability) {
        setState({ kind: "expired" });
        return;
      }
      const result = await acceptInvitation(token, inviteCapability);
      void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      void queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      if (result.alreadyMember) {
        setState({ kind: "already", workspace: result.workspace });
      } else {
        setState({ kind: "success", workspace: result.workspace });
      }
    } catch (err) {
      setState(stateForError(err, t("invite.unknownError"), preview));
    }
  };

  const pillPrimary = {
    backgroundColor: theme.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: "center" as const,
  };

  const centeredMessage = (input: {
    title: string;
    body: string;
    primary: { label: string; onPress: () => void };
    secondary?: { label: string; onPress: () => void };
  }) => (
    <View
      style={{
        flex: 1,
        paddingHorizontal: spacing[6],
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ ...typography.title, color: theme.text, textAlign: "center" }}>
        {input.title}
      </Text>
      <Text
        style={{
          ...typography.body,
          color: theme.textBody,
          textAlign: "center",
          marginTop: spacing[3],
        }}
      >
        {input.body}
      </Text>
      <Pressable
        onPress={input.primary.onPress}
        style={{ ...pillPrimary, marginTop: spacing[6], alignSelf: "stretch" }}
      >
        <Text style={{ ...typography.label, color: theme.onPrimary }}>
          {input.primary.label}
        </Text>
      </Pressable>
      {input.secondary ? (
        <Pressable onPress={input.secondary.onPress} style={{ marginTop: spacing[4] }}>
          <Text style={{ ...typography.label, color: theme.text, textAlign: "center" }}>
            {input.secondary.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

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

      {state.kind === "wrong_account"
        ? centeredMessage({
            title: t("invite.wrongAccountTitle"),
            body: t("invite.wrongAccountBody"),
            primary: { label: t("invite.switchAccount"), onPress: () => void switchAccount() },
            secondary: { label: t("invite.cancel"), onPress: dismissWithoutAccept },
          })
        : null}

      {state.kind === "expired"
        ? centeredMessage({
            title: t("invite.expiredTitle"),
            body: t("invite.expiredBody"),
            primary: { label: t("invite.goHome"), onPress: dismissWithoutAccept },
          })
        : null}

      {state.kind === "used"
        ? centeredMessage({
            title: t("invite.usedTitle"),
            body: t("invite.usedBody"),
            primary: { label: t("invite.goHome"), onPress: dismissWithoutAccept },
          })
        : null}

      {state.kind === "error"
        ? centeredMessage({
            title: t("invite.errorTitle"),
            body: state.message,
            primary: { label: t("auth.retry"), onPress: reloadPreview },
          })
        : null}

      {showChrome &&
      (state.kind === "preview" ||
        state.kind === "joining" ||
        state.kind === "success" ||
        state.kind === "already") ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
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
              onSwitchAccount={() => void switchAccount()}
              nameBlock={
                me.isSuccess ? (
                  <View style={{ alignSelf: "stretch", marginTop: spacing[5] }}>
                    {!myName || editingName ? (
                      <>
                        <NameField
                          label={t("name.fieldLabelJoin")}
                          value={nameDraft}
                          onChangeText={(value) => {
                            setNameDraft(value);
                            setNameError(null);
                          }}
                        />
                        {nameError ? (
                          <Text style={{ ...typography.caption, color: theme.danger }}>
                            {nameError}
                          </Text>
                        ) : null}
                      </>
                    ) : (
                      <NameAsLine
                        text={t("name.joinAs", { name: myName })}
                        onChange={() => {
                          setNameDraft(myName);
                          setEditingName(true);
                        }}
                      />
                    )}
                  </View>
                ) : null
              }
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
  onSwitchAccount,
  nameBlock,
}: {
  preview: InvitationPreview;
  locale: string;
  joining: boolean;
  onJoin: () => void;
  onDecline: () => void;
  onSwitchAccount: () => void;
  nameBlock: ReactNode;
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
        style={{ width: 200, height: 200, resizeMode: "contain" }}
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
        {preview.inviterHasName
          ? t("invite.headline", {
              name: preview.inviterDisplayName,
              workspace: preview.workspace.name,
            })
          : t("invite.headlineNoName", { workspace: preview.workspace.name })}
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

      {nameBlock}

      {preview.differentEmail ? (
        <View style={{ alignSelf: "stretch", marginTop: spacing[4] }}>
          <Text style={{ ...typography.caption, color: theme.textMuted, lineHeight: 18 }}>
            {t("invite.differentEmail", {
              invited: preview.differentEmail.invitedEmail,
              account: preview.differentEmail.accountEmail,
            })}
          </Text>
          <Pressable
            onPress={onSwitchAccount}
            disabled={joining}
            hitSlop={8}
            accessibilityRole="button"
            style={{ alignSelf: "flex-start", paddingVertical: spacing[1] }}
          >
            <Text style={{ ...typography.caption, color: theme.primary, fontWeight: "700" }}>
              {t("invite.switchAccount")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={onJoin}
        disabled={joining}
        style={{
          marginTop: spacing[6],
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
