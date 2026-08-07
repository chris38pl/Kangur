import { useOAuth, useSignIn } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import {
  primaryButtonStyle,
  secondaryButtonStyle,
} from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { AuthBrandHero } from "@/features/auth/auth-brand-hero";
import {
  BackIcon,
  EyeIcon,
  GoogleIcon,
  LockFieldIcon,
  MailFieldIcon,
} from "@/features/auth/auth-icons";
import { getClerkErrorMessage } from "@/features/auth/clerk-error";
import { logAuthSuccess, runClerkOAuth } from "@/features/auth/oauth";
import { useKeyboardScroll } from "@/hooks/useKeyboardScroll";
import { Analytics } from "@/lib/analytics";

const RESEND_COOLDOWN_SECONDS = 60;

type Step = "email" | "code" | "password" | "no_password";

function getClerkErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const err = error as { errors?: { code?: string }[]; code?: string };
  return err.errors?.[0]?.code ?? err.code ?? null;
}

function isIdentifierNotFound(error: unknown): boolean {
  const code = getClerkErrorCode(error);
  return (
    code === "form_identifier_not_found" ||
    code === "form_identifier_not_found__email_address"
  );
}

function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { message?: string; errors?: { code?: string }[] };
  const code = err.errors?.[0]?.code;
  if (code === "network_error" || code === "failed_to_fetch") return true;
  const msg = (err.message ?? "").toLowerCase();
  return (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("offline") ||
    msg.includes("internet")
  );
}

type ResetEmailFactor = {
  strategy: "reset_password_email_code";
  emailAddressId: string;
};

function findResetEmailFactor(
  factors: Array<{ strategy: string; emailAddressId?: string }> | undefined,
): ResetEmailFactor | null {
  const match = factors?.find((f) => f.strategy === "reset_password_email_code");
  if (!match?.emailAddressId) return null;
  return {
    strategy: "reset_password_email_code",
    emailAddressId: match.emailAddressId,
  };
}

function hasGoogleOAuthFactor(
  factors: Array<{ strategy: string }> | undefined,
): boolean {
  return Boolean(factors?.some((f) => f.strategy === "oauth_google"));
}

/**
 * Forgot / reset password via Clerk `reset_password_email_code`.
 * Mid-flow is not persisted across app kills.
 */
export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });

  const {
    scrollRef,
    onScroll,
    bindFieldFocus,
    setFormBlockRef,
    contentPaddingBottom,
  } = useKeyboardScroll();

  const emailFieldRef = useRef<View>(null);
  const codeFieldRef = useRef<View>(null);
  const passwordFieldRef = useRef<View>(null);
  const codeInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const emailFocus = bindFieldFocus(emailFieldRef);
  const codeFocus = bindFieldFocus(codeFieldRef);
  const passwordFocus = bindFieldFocus(passwordFieldRef);

  const prefill =
    typeof params.email === "string" ? params.email.trim() : "";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(prefill);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);
  /** Privacy mode: pretend code was sent; no real Clerk attempt. */
  const [privacyOnly, setPrivacyOnly] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    Analytics.track("forgot_password_started", {});
  }, []);

  useEffect(() => {
    if (resendSecondsLeft <= 0) return;
    const id = setTimeout(() => {
      setResendSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearTimeout(id);
  }, [resendSecondsLeft]);

  const focusAfterStep = (next: Step) => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (next === "code") codeInputRef.current?.focus();
        if (next === "password") passwordInputRef.current?.focus();
      }, 50);
    });
  };

  const startResendCooldown = () => {
    setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
  };

  const clearMidFlowState = () => {
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setNetworkError(false);
    setBusy(false);
    setResendSecondsLeft(0);
    setEmailAddressId(null);
    setPrivacyOnly(false);
    setShowPassword(false);
    setShowConfirm(false);
  };

  const showError = (message: string, isNetwork = false) => {
    setError(message);
    setNetworkError(isNetwork);
  };

  const clearError = () => {
    setError(null);
    setNetworkError(false);
  };

  const onChangeEmail = () => {
    clearMidFlowState();
    setStep("email");
  };

  const goBackToSignIn = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/sign-in");
  };

  const trackFailed = (
    stepName: "email" | "code" | "password" | "resend" | "oauth",
    err: unknown,
  ) => {
    Analytics.track("forgot_password_failed", {
      step: stepName,
      clerk_code: getClerkErrorCode(err) ?? undefined,
    });
  };

  const onSendCode = async () => {
    if (!isLoaded || !signIn) return;
    const identifier = email.trim();
    if (!identifier) {
      showError(t("auth.forgotPasswordEmailRequired"));
      return;
    }

    setBusy(true);
    clearError();
    try {
      // Primary path: create with reset strategy (sends the code).
      const created = await signIn.create({
        strategy: "reset_password_email_code",
        identifier,
      });
      const factors = created.supportedFirstFactors as
        | Array<{ strategy: string; emailAddressId?: string }>
        | undefined;
      const resetFactor = findResetEmailFactor(factors);

      if (!resetFactor) {
        // Unexpected: strategy create succeeded but no factor id — treat as sent.
        setPrivacyOnly(false);
        setEmailAddressId(null);
        setStep("code");
        startResendCooldown();
        focusAfterStep("code");
        Analytics.track("forgot_password_code_sent", { resend: false });
        return;
      }

      setPrivacyOnly(false);
      setEmailAddressId(resetFactor.emailAddressId);
      setStep("code");
      startResendCooldown();
      focusAfterStep("code");
      Analytics.track("forgot_password_code_sent", { resend: false });
    } catch (err) {
      console.info("[auth]", "ForgotPasswordSendFailed", err);
      if (isIdentifierNotFound(err)) {
        setPrivacyOnly(true);
        setEmailAddressId(null);
        setStep("code");
        startResendCooldown();
        focusAfterStep("code");
        Analytics.track("forgot_password_code_sent", { resend: false });
        return;
      }
      if (isNetworkError(err)) {
        trackFailed("email", err);
        showError(t("auth.errors.NETWORK_ERROR"), true);
        return;
      }

      // Strategy may be unavailable (e.g. OAuth-only). Probe factors.
      try {
        const probed = await signIn.create({ identifier });
        const factors = probed.supportedFirstFactors as
          | Array<{ strategy: string; emailAddressId?: string }>
          | undefined;
        const resetFactor = findResetEmailFactor(factors);
        if (!resetFactor && hasGoogleOAuthFactor(factors)) {
          setStep("no_password");
          return;
        }
        if (resetFactor) {
          await signIn.prepareFirstFactor({
            strategy: "reset_password_email_code",
            emailAddressId: resetFactor.emailAddressId,
          });
          setPrivacyOnly(false);
          setEmailAddressId(resetFactor.emailAddressId);
          setStep("code");
          startResendCooldown();
          focusAfterStep("code");
          Analytics.track("forgot_password_code_sent", { resend: false });
          return;
        }
        setPrivacyOnly(true);
        setEmailAddressId(null);
        setStep("code");
        startResendCooldown();
        focusAfterStep("code");
        Analytics.track("forgot_password_code_sent", { resend: false });
        return;
      } catch (probeErr) {
        if (isIdentifierNotFound(probeErr)) {
          setPrivacyOnly(true);
          setEmailAddressId(null);
          setStep("code");
          startResendCooldown();
          focusAfterStep("code");
          Analytics.track("forgot_password_code_sent", { resend: false });
          return;
        }
        trackFailed("email", probeErr);
        if (isNetworkError(probeErr) || isNetworkError(err)) {
          showError(t("auth.errors.NETWORK_ERROR"), true);
        } else {
          showError(
            getClerkErrorMessage(
              probeErr,
              t,
              "auth.forgotPasswordSendFailed",
            ),
          );
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const onResendCode = async () => {
    if (!isLoaded || !signIn || resendSecondsLeft > 0) return;
    if (privacyOnly || !emailAddressId) {
      // Privacy path: pretend resend worked; do not call Clerk.
      startResendCooldown();
      Analytics.track("forgot_password_code_sent", { resend: true });
      return;
    }

    setBusy(true);
    clearError();
    try {
      await signIn.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId,
      });
      startResendCooldown();
      Analytics.track("forgot_password_code_sent", { resend: true });
    } catch (err) {
      console.info("[auth]", "ForgotPasswordResendFailed", err);
      trackFailed("resend", err);
      if (isNetworkError(err)) {
        showError(t("auth.errors.NETWORK_ERROR"), true);
      } else {
        showError(
          getClerkErrorMessage(err, t, "auth.forgotPasswordSendFailed"),
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const onVerifyCode = async () => {
    if (!isLoaded || !signIn) return;
    if (privacyOnly) {
      showError(t("auth.errors.verificationFailed"));
      trackFailed("code", { code: "privacy_only" });
      return;
    }

    const trimmed = code.trim();
    if (!trimmed) {
      showError(t("auth.forgotPasswordCodeRequired"));
      return;
    }

    setBusy(true);
    clearError();
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: trimmed,
      });

      if (result.status === "needs_new_password") {
        Analytics.track("forgot_password_verified", {});
        setStep("password");
        focusAfterStep("password");
        return;
      }

      if (result.status === "complete" && result.createdSessionId) {
        // Defensive: some Clerk configs may skip needs_new_password.
        Analytics.track("forgot_password_verified", {});
        await setActive({ session: result.createdSessionId });
        Analytics.track("forgot_password_completed", {});
        logAuthSuccess({
          event: "SignIn",
          provider: "email",
          email: email.trim(),
          createdSession: true,
        });
        return;
      }

      showError(t("auth.errors.incomplete"));
      trackFailed("code", { code: result.status });
    } catch (err) {
      console.info("[auth]", "ForgotPasswordVerifyFailed", err);
      trackFailed("code", err);
      if (isNetworkError(err)) {
        showError(t("auth.errors.NETWORK_ERROR"), true);
      } else {
        showError(
          getClerkErrorMessage(err, t, "auth.errors.verificationFailed"),
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const onSubmitPassword = async () => {
    if (!isLoaded || !signIn) return;
    const next = password.trim();
    const confirm = confirmPassword.trim();

    if (!next || !confirm) {
      showError(t("auth.forgotPasswordPasswordRequired"));
      return;
    }
    if (next !== confirm) {
      showError(t("auth.forgotPasswordMismatch"));
      return;
    }

    setBusy(true);
    clearError();
    try {
      const result = await signIn.resetPassword({
        password: next,
        signOutOfOtherSessions: true,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        Analytics.track("forgot_password_completed", {});
        logAuthSuccess({
          event: "SignIn",
          provider: "email",
          email: email.trim(),
          createdSession: true,
        });
        // Auth layout Redirect handles navigation to tabs.
        return;
      }

      showError(t("auth.errors.incomplete"));
      trackFailed("password", { code: result.status });
    } catch (err) {
      console.info("[auth]", "ForgotPasswordResetFailed", err);
      trackFailed("password", err);
      if (isNetworkError(err)) {
        showError(t("auth.errors.NETWORK_ERROR"), true);
      } else {
        showError(
          getClerkErrorMessage(err, t, "auth.forgotPasswordResetFailed"),
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const onContinueGoogle = async () => {
    setBusy(true);
    clearError();
    try {
      if (!setActive) throw new Error("Clerk not ready");
      const { createdSessionId } = await runClerkOAuth({
        startOAuthFlow: startGoogleOAuth,
      });
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        logAuthSuccess({
          event: "SignIn",
          provider: "google",
          createdSession: true,
        });
      }
    } catch (err) {
      console.info("[auth]", "ForgotPasswordGoogleFailed", err);
      trackFailed("oauth", err);
      showError(getClerkErrorMessage(err, t, "auth.errors.googleFailed"));
    } finally {
      setBusy(false);
    }
  };

  const pillPrimary = {
    ...primaryButtonStyle(theme),
    borderRadius: radius.full,
  };

  const pillSecondary = {
    ...secondaryButtonStyle(theme),
    borderRadius: radius.full,
    flexDirection: "row" as const,
    gap: spacing[2],
  };

  const fieldShell = (focused: boolean) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing[3],
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: focused ? theme.primary : theme.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    minHeight: 56,
  });

  const title =
    step === "code"
      ? t("auth.forgotPasswordCodeTitle")
      : step === "password"
        ? t("auth.forgotPasswordNewPasswordTitle")
        : step === "no_password"
          ? t("auth.forgotPasswordNoPasswordTitle")
          : t("auth.forgotPasswordTitle");

  const subtitle =
    step === "code"
      ? t("auth.forgotPasswordCodeSentPrivacy")
      : step === "password"
        ? t("auth.forgotPasswordNewPasswordSubtitle")
        : step === "no_password"
          ? t("auth.forgotPasswordNoPasswordBody")
          : t("auth.forgotPasswordSubtitle");

  return (
    <Screen style={{ backgroundColor: theme.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing[6],
            paddingTop: spacing[4],
            paddingBottom: contentPaddingBottom,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <Pressable
            onPress={() => {
              if (step === "email" || step === "no_password") {
                goBackToSignIn();
                return;
              }
              onChangeEmail();
            }}
            accessibilityRole="button"
            accessibilityLabel={
              step === "email" || step === "no_password"
                ? t("auth.back")
                : t("auth.forgotPasswordChangeEmail")
            }
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing[2],
            }}
          >
            <BackIcon size={20} />
          </Pressable>

          <AuthBrandHero />

          <Text
            style={{
              ...typography.title,
              color: theme.text,
              textAlign: "center",
              marginTop: spacing[4],
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              textAlign: "center",
              marginTop: spacing[2],
              marginBottom: spacing[6],
            }}
          >
            {subtitle}
          </Text>

          {step === "email" ? (
            <View ref={setFormBlockRef} collapsable={false}>
              <View
                ref={emailFieldRef}
                collapsable={false}
                style={fieldShell(emailFocused)}
              >
                <MailFieldIcon size={20} />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  placeholder={t("auth.emailPlaceholder")}
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  editable={!busy}
                  onFocus={() => {
                    setEmailFocused(true);
                    emailFocus.onFocus();
                  }}
                  onBlur={() => {
                    setEmailFocused(false);
                    emailFocus.onBlur();
                  }}
                  style={{
                    flex: 1,
                    color: theme.text,
                    fontSize: typography.body.fontSize,
                    paddingVertical: spacing[3],
                  }}
                />
              </View>

              {error ? (
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.danger,
                    marginTop: spacing[3],
                    textAlign: "center",
                  }}
                >
                  {error}
                </Text>
              ) : null}

              <Pressable
                disabled={busy || !isLoaded}
                onPress={() => void onSendCode()}
                style={{
                  ...pillPrimary,
                  marginTop: spacing[6],
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? (
                  <ActivityIndicator color={theme.onPrimary} />
                ) : (
                  <Text style={{ ...typography.label, color: theme.onPrimary }}>
                    {networkError
                      ? t("auth.retry")
                      : t("auth.forgotPasswordSendCode")}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={goBackToSignIn}
                disabled={busy}
                style={{
                  marginTop: spacing[5],
                  alignItems: "center",
                  paddingVertical: spacing[3],
                }}
              >
                <Text style={{ ...typography.label, color: theme.textMuted }}>
                  {t("auth.forgotPasswordBackToSignIn")}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {step === "code" ? (
            <View ref={setFormBlockRef} collapsable={false}>
              <View
                ref={codeFieldRef}
                collapsable={false}
                style={fieldShell(codeFocused)}
              >
                <TextInput
                  ref={codeInputRef}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  placeholder={t("auth.verificationCode")}
                  placeholderTextColor={theme.textMuted}
                  value={code}
                  onChangeText={setCode}
                  editable={!busy}
                  onFocus={() => {
                    setCodeFocused(true);
                    codeFocus.onFocus();
                  }}
                  onBlur={() => {
                    setCodeFocused(false);
                    codeFocus.onBlur();
                  }}
                  style={{
                    flex: 1,
                    color: theme.text,
                    fontSize: typography.body.fontSize,
                    paddingVertical: spacing[3],
                  }}
                />
              </View>

              {error ? (
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.danger,
                    marginTop: spacing[3],
                    textAlign: "center",
                  }}
                >
                  {error}
                </Text>
              ) : null}

              <Pressable
                disabled={busy || !isLoaded}
                onPress={() => void onVerifyCode()}
                style={{
                  ...pillPrimary,
                  marginTop: spacing[6],
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? (
                  <ActivityIndicator color={theme.onPrimary} />
                ) : (
                  <Text style={{ ...typography.label, color: theme.onPrimary }}>
                    {networkError ? t("auth.retry") : t("auth.verify")}
                  </Text>
                )}
              </Pressable>

              <Pressable
                disabled={busy || resendSecondsLeft > 0}
                onPress={() => void onResendCode()}
                style={{
                  marginTop: spacing[4],
                  alignItems: "center",
                  paddingVertical: spacing[3],
                  opacity: resendSecondsLeft > 0 ? 0.5 : 1,
                }}
              >
                <Text style={{ ...typography.label, color: theme.primary }}>
                  {resendSecondsLeft > 0
                    ? t("auth.forgotPasswordResendIn", {
                        seconds: resendSecondsLeft,
                      })
                    : t("auth.forgotPasswordResend")}
                </Text>
              </Pressable>

              <Pressable
                onPress={onChangeEmail}
                disabled={busy}
                style={{
                  marginTop: spacing[2],
                  alignItems: "center",
                  paddingVertical: spacing[2],
                }}
              >
                <Text style={{ ...typography.label, color: theme.textMuted }}>
                  {t("auth.forgotPasswordChangeEmail")}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {step === "password" ? (
            <View ref={setFormBlockRef} collapsable={false}>
              <View
                ref={passwordFieldRef}
                collapsable={false}
                style={[fieldShell(passwordFocused), { marginBottom: spacing[3] }]}
              >
                <LockFieldIcon size={20} />
                <TextInput
                  ref={passwordInputRef}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  placeholder={t("auth.forgotPasswordNewPasswordPlaceholder")}
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  editable={!busy}
                  onFocus={() => {
                    setPasswordFocused(true);
                    passwordFocus.onFocus();
                  }}
                  onBlur={() => {
                    setPasswordFocused(false);
                    passwordFocus.onBlur();
                  }}
                  style={{
                    flex: 1,
                    color: theme.text,
                    fontSize: typography.body.fontSize,
                    paddingVertical: spacing[3],
                  }}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? t("auth.hidePassword") : t("auth.showPassword")
                  }
                >
                  <EyeIcon size={20} off={showPassword} />
                </Pressable>
              </View>

              <View style={fieldShell(confirmFocused)}>
                <LockFieldIcon size={20} />
                <TextInput
                  secureTextEntry={!showConfirm}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  placeholder={t("auth.forgotPasswordConfirmPlaceholder")}
                  placeholderTextColor={theme.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!busy}
                  onFocus={() => setConfirmFocused(true)}
                  onBlur={() => setConfirmFocused(false)}
                  style={{
                    flex: 1,
                    color: theme.text,
                    fontSize: typography.body.fontSize,
                    paddingVertical: spacing[3],
                  }}
                />
                <Pressable
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showConfirm ? t("auth.hidePassword") : t("auth.showPassword")
                  }
                >
                  <EyeIcon size={20} off={showConfirm} />
                </Pressable>
              </View>

              {error ? (
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.danger,
                    marginTop: spacing[3],
                    textAlign: "center",
                  }}
                >
                  {error}
                </Text>
              ) : null}

              <Pressable
                disabled={busy || !isLoaded}
                onPress={() => void onSubmitPassword()}
                style={{
                  ...pillPrimary,
                  marginTop: spacing[6],
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? (
                  <ActivityIndicator color={theme.onPrimary} />
                ) : (
                  <Text style={{ ...typography.label, color: theme.onPrimary }}>
                    {networkError
                      ? t("auth.retry")
                      : t("auth.forgotPasswordSubmit")}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={onChangeEmail}
                disabled={busy}
                style={{
                  marginTop: spacing[4],
                  alignItems: "center",
                  paddingVertical: spacing[3],
                }}
              >
                <Text style={{ ...typography.label, color: theme.textMuted }}>
                  {t("auth.forgotPasswordChangeEmail")}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {step === "no_password" ? (
            <View>
              {error ? (
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.danger,
                    marginBottom: spacing[3],
                    textAlign: "center",
                  }}
                >
                  {error}
                </Text>
              ) : null}

              <Pressable
                disabled={busy || !isLoaded}
                onPress={() => void onContinueGoogle()}
                style={{ ...pillSecondary, opacity: busy ? 0.7 : 1 }}
              >
                {busy ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <>
                    <GoogleIcon size={20} />
                    <Text style={{ ...typography.label, color: theme.text }}>
                      {t("auth.forgotPasswordContinueGoogle")}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={goBackToSignIn}
                disabled={busy}
                style={{
                  marginTop: spacing[5],
                  alignItems: "center",
                  paddingVertical: spacing[3],
                }}
              >
                <Text style={{ ...typography.label, color: theme.textMuted }}>
                  {t("auth.forgotPasswordBackToSignIn")}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
