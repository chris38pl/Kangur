import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { useMe } from "@/features/auth/useMe";
import { nameProblem, normalizeNameInput } from "@/features/profile/display-name";
import { NameAsLine } from "@/features/profile/name-as-line";
import { NameField } from "@/features/profile/name-field";
import { useUpdateDisplayName } from "@/features/profile/useUpdateDisplayName";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { useOpenSession } from "@/hooks/useOpenSession";
import { Analytics } from "@/lib/analytics";
import { ApiClientError } from "@/lib/api/client";

import { InviteSentBody } from "./invite-sent-sheet";
import { InviteQrCode, MailGlyph, QrGlyph, ShareGlyph } from "./invite-qr";
import {
  useCreateInvitation,
  useCreateInviteLink,
  useWorkspaceInvitations,
} from "./useWorkspaceInvites";

type Step = "menu" | "code" | "email" | "sent";

type CodeLink = { url: string; id: string; expiresAt: string };

/**
 * The code shown last, per workspace, for this app session: opening "Show code" again
 * shows the same one while nobody used it, instead of making a new link each time.
 */
const shownCodes = new Map<string, CodeLink>();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  visible: boolean;
  workspace: { id: string; name: string };
  onClose: () => void;
};

/**
 * "Invite", from the simplest way: a code the other phone scans, a link for the share
 * sheet, or an e-mail. Code and link are one-time keys (7 days); nobody types an address,
 * a nickname or a name. Someone without a name gets one field for the invitation.
 */
export function InviteSheet(props: Props) {
  const session = useOpenSession(props.visible);
  return <InviteSheetContent key={session} {...props} />;
}

/** The code was made earlier this session and still waits for its person. */
function isStillWaiting(shown: CodeLink, pendingIds: readonly string[] | undefined): boolean {
  return new Date(shown.expiresAt).getTime() > Date.now() && Boolean(pendingIds?.includes(shown.id));
}

function InviteSheetContent({ visible, workspace, onClose }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const keyboardHeight = useKeyboardHeight(visible);
  const me = useMe(visible);
  const myName = me.data?.displayName ?? null;

  const [step, setStep] = useState<Step>("menu");
  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<CodeLink | null>(null);
  const [sent, setSent] = useState<{ email: string; resent: boolean; delivered: boolean } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const skippedName = useRef(false);

  const nameMutation = useUpdateDisplayName("invite");
  const linkMutation = useCreateInviteLink(workspace.id);
  const emailMutation = useCreateInvitation(workspace.id);
  const invitations = useWorkspaceInvitations(workspace.id, visible);
  const busy = nameMutation.isPending || linkMutation.isPending || emailMutation.isPending;

  const nameless = me.isSuccess && !myName;
  useEffect(() => {
    if (visible && nameless) Analytics.track("name_prompt_shown", { place: "invite" });
  }, [visible, nameless]);

  const showNameField = nameless || editingName;

  const close = () => {
    if (busy) return;
    Keyboard.dismiss();
    onClose();
  };

  /** Saves a name typed in the sheet. False when it cannot be used, and the action waits. */
  const commitName = async (): Promise<boolean> => {
    if (!showNameField) return true;
    const draft = normalizeNameInput(nameDraft);
    if (!draft) {
      if (!myName && !skippedName.current) {
        skippedName.current = true;
        Analytics.track("name_skipped", { place: "invite" });
      }
      setEditingName(false);
      return true;
    }
    const problem = nameProblem(draft);
    if (problem) {
      setNameError(problem === "email" ? t("name.notEmail") : t("name.tooLong"));
      return false;
    }
    if (draft === myName) {
      setEditingName(false);
      return true;
    }
    try {
      await nameMutation.mutateAsync(draft);
      setEditingName(false);
      setNameError(null);
      return true;
    } catch (failure) {
      const reason = failure instanceof ApiClientError ? failure.details?.reason : null;
      setNameError(reason === "name_email" ? t("name.notEmail") : t("name.saveFailed"));
      return false;
    }
  };

  const linkError = (failure: unknown) =>
    failure instanceof ApiClientError && failure.status === 429
      ? t("workspace.inviteLinkLimit")
      : failure instanceof ApiClientError && failure.status === 403
        ? t("workspace.inviteForbidden")
        : t("workspace.inviteLinkFailed");

  const showCode = async () => {
    setError(null);
    if (!(await commitName())) return;
    const shown = shownCodes.get(workspace.id);
    if (shown) {
      // Fresh list: a code someone already used must not be shown again.
      const fresh = await invitations.refetch();
      if (isStillWaiting(shown, fresh.data?.map((invitation) => invitation.id))) {
        setCode(shown);
        setStep("code");
        return;
      }
    }
    linkMutation.mutate("code", {
      onSuccess: (result) => {
        const entry = {
          url: result.url,
          id: result.invitation.id,
          expiresAt: result.invitation.expiresAt,
        };
        shownCodes.set(workspace.id, entry);
        setCode(entry);
        setStep("code");
      },
      onError: (failure) => setError(linkError(failure)),
    });
  };

  const shareLink = async () => {
    setError(null);
    if (!(await commitName())) return;
    linkMutation.mutate("share", {
      onSuccess: async (result) => {
        const text = t("workspace.inviteShareText", { workspace: workspace.name });
        try {
          // iOS shows the link as its own item; Android shares only the message.
          await Share.share(
            Platform.OS === "ios"
              ? { message: text, url: result.url }
              : { message: `${text} ${result.url}` },
          );
        } catch {
          // The sheet was closed: the link stays in the list and can be revoked.
        }
      },
      onError: (failure) => setError(linkError(failure)),
    });
  };

  const sendEmail = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError(t("workspace.inviteInvalidEmail"));
      return;
    }
    if (!(await commitName())) return;
    emailMutation.mutate(trimmed, {
      onSuccess: (result) => {
        Keyboard.dismiss();
        setEmail("");
        setSent({
          email: trimmed,
          resent: result.status === "resent",
          delivered: result.emailDelivered,
        });
        setStep("sent");
      },
      onError: (failure) => {
        if (failure instanceof ApiClientError) {
          if (failure.status === 409) return setError(t("workspace.inviteAlreadyMember"));
          if (failure.status === 400) return setError(failure.message || t("workspace.inviteInvalidEmail"));
          if (failure.status === 403) return setError(t("workspace.inviteForbidden"));
        }
        setError(t("workspace.inviteFailed"));
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

  const primaryButton = (label: string, onPress: () => void, disabled = false) => (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      style={{
        marginTop: spacing[5],
        backgroundColor: theme.primary,
        borderRadius: radius.full,
        paddingVertical: spacing[4],
        alignItems: "center",
        opacity: disabled || busy ? 0.7 : 1,
      }}
    >
      {busy ? (
        <ActivityIndicator color={theme.onPrimary} />
      ) : (
        <Text style={{ ...typography.label, color: theme.onPrimary }}>{label}</Text>
      )}
    </Pressable>
  );

  const textButton = (label: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      style={{ marginTop: spacing[3], minHeight: 44, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ ...typography.label, color: theme.textMuted }}>{label}</Text>
    </Pressable>
  );

  const nameBlock = (
    <View style={{ marginTop: spacing[4] }}>
      {showNameField ? (
        <>
          <NameField
            label={t("name.fieldLabelInvite")}
            value={nameDraft}
            onChangeText={(value) => {
              setNameDraft(value);
              setNameError(null);
            }}
          />
          {nameError ? (
            <Text style={{ ...typography.caption, color: theme.danger }}>{nameError}</Text>
          ) : null}
        </>
      ) : myName ? (
        <NameAsLine
          text={t("name.inviteAs", { name: myName })}
          onChange={() => {
            setNameDraft(myName);
            setEditingName(true);
          }}
        />
      ) : null}
    </View>
  );

  const option = (input: {
    icon: ReactNode;
    title: string;
    hint: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={input.onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={input.title}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        backgroundColor: theme.section,
        borderRadius: radius.lg,
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[4],
        marginTop: spacing[3],
        opacity: pressed || busy ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.full,
          backgroundColor: theme.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {input.icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ ...typography.label, color: theme.text }}>{input.title}</Text>
        <Text style={{ ...typography.caption, color: theme.textMuted, marginTop: 2 }}>
          {input.hint}
        </Text>
      </View>
    </Pressable>
  );

  const qrSize = Math.min(280, width - spacing[6] * 2 - spacing[4] * 2);
  const bottomPad =
    keyboardHeight > 0 ? spacing[4] : spacing[6] + Math.max(insets.bottom, spacing[4]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("workspace.close")}
          onPress={close}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        />
        <View
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            maxHeight: "92%",
            paddingTop: spacing[6],
            paddingHorizontal: spacing[6],
            paddingBottom: bottomPad,
            marginBottom: keyboardHeight,
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {step === "menu" ? (
              <>
                <Text style={{ ...typography.title, color: theme.text }}>
                  {t("workspace.inviteSheetTitle", { workspace: workspace.name })}
                </Text>
                {nameBlock}
                {option({
                  icon: <QrGlyph color={theme.primary} />,
                  title: t("workspace.inviteShowCode"),
                  hint: t("workspace.inviteShowCodeHint"),
                  onPress: () => void showCode(),
                })}
                {option({
                  icon: <ShareGlyph color={theme.primary} />,
                  title: t("workspace.inviteShareLink"),
                  hint: t("workspace.inviteShareLinkHint"),
                  onPress: () => void shareLink(),
                })}
                {option({
                  icon: <MailGlyph color={theme.primary} />,
                  title: t("workspace.inviteByEmail"),
                  hint: t("workspace.inviteByEmailShort"),
                  onPress: () => {
                    setError(null);
                    setStep("email");
                  },
                })}
                {busy ? (
                  <ActivityIndicator color={theme.primary} style={{ marginTop: spacing[4] }} />
                ) : null}
                {error ? (
                  <Text style={{ ...typography.caption, color: theme.danger, marginTop: spacing[3] }}>
                    {error}
                  </Text>
                ) : null}
                {textButton(t("workspace.cancel"), close)}
              </>
            ) : null}

            {step === "code" && code ? (
              <>
                <Text style={{ ...typography.title, color: theme.text, textAlign: "center" }}>
                  {t("workspace.inviteCodeTitle")}
                </Text>
                <View
                  style={{
                    alignSelf: "center",
                    marginTop: spacing[5],
                    padding: spacing[4],
                    backgroundColor: "#FFFFFF",
                    borderRadius: radius.xl,
                  }}
                >
                  <InviteQrCode url={code.url} size={qrSize} label={t("workspace.inviteCodeA11y")} />
                </View>
                <Text
                  style={{
                    ...typography.body,
                    color: theme.textBody,
                    textAlign: "center",
                    marginTop: spacing[5],
                  }}
                >
                  {t("workspace.inviteCodeBody")}
                </Text>
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                    textAlign: "center",
                    marginTop: spacing[2],
                  }}
                >
                  {t("workspace.inviteCodeOnce")}
                </Text>
                {primaryButton(t("workspace.inviteDone"), close)}
                {textButton(t("auth.back"), () => setStep("menu"))}
              </>
            ) : null}

            {step === "email" ? (
              <>
                <Text style={{ ...typography.title, color: theme.text }}>
                  {t("workspace.inviteByEmail")}
                </Text>
                {nameBlock}
                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setError(null);
                  }}
                  placeholder={t("workspace.inviteEmailPlaceholder")}
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={() => void sendEmail()}
                  style={{ ...fieldStyle, marginTop: spacing[4] }}
                />
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                    marginTop: spacing[2],
                    lineHeight: 18,
                  }}
                >
                  {t("workspace.inviteByEmailHint")}
                </Text>
                {error ? (
                  <Text style={{ ...typography.caption, color: theme.danger, marginTop: spacing[3] }}>
                    {error}
                  </Text>
                ) : null}
                {primaryButton(t("workspace.inviteSend"), () => void sendEmail())}
                {textButton(t("auth.back"), () => setStep("menu"))}
              </>
            ) : null}

            {step === "sent" && sent ? (
              <>
                <InviteSentBody email={sent.email} resent={sent.resent} delivered={sent.delivered} />
                {primaryButton(t("common.return"), close)}
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
