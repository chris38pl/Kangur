import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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

import { KangurMascot } from "@/components/KangurMascot";
import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import {
  primaryButtonStyle,
  secondaryButtonStyle,
} from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { AuthBrandHero } from "@/features/auth/auth-brand-hero";
import { getClerkErrorMessage } from "@/features/auth/clerk-error";
import {
  AppleIcon,
  BackIcon,
  EyeIcon,
  GoogleIcon,
  LockFieldIcon,
  MailFieldIcon,
} from "@/features/auth/auth-icons";
import { logAuthSuccess, runClerkOAuth } from "@/features/auth/oauth";
import { useKeyboardScroll } from "@/hooks/useKeyboardScroll";

WebBrowser.maybeCompleteAuthSession();

const RESEND_COOLDOWN_SECONDS = 60;

type Step = "credentials" | "verify";
type EmailCodeFactorKind = "first" | "second";

type EmailCodeFactor = {
  kind: EmailCodeFactorKind;
  emailAddressId?: string;
  safeIdentifier?: string;
};

function findEmailCodeFactor(result: {
  status: string | null;
  supportedFirstFactors?: Array<{
    strategy: string;
    emailAddressId?: string;
    safeIdentifier?: string;
  }> | null;
  supportedSecondFactors?: Array<{
    strategy: string;
    emailAddressId?: string;
    safeIdentifier?: string;
  }> | null;
}): EmailCodeFactor | null {
  if (result.status === "needs_second_factor") {
    const match = result.supportedSecondFactors?.find(
      (f) => f.strategy === "email_code",
    );
    if (!match) return null;
    return {
      kind: "second",
      emailAddressId: match.emailAddressId,
      safeIdentifier: match.safeIdentifier,
    };
  }

  if (result.status === "needs_first_factor") {
    const match = result.supportedFirstFactors?.find(
      (f) => f.strategy === "email_code",
    );
    if (!match?.emailAddressId) return null;
    return {
      kind: "first",
      emailAddressId: match.emailAddressId,
      safeIdentifier: match.safeIdentifier,
    };
  }

  // Password accepted but email verification still required (some Clerk configs).
  const second = result.supportedSecondFactors?.find(
    (f) => f.strategy === "email_code",
  );
  if (second) {
    return {
      kind: "second",
      emailAddressId: second.emailAddressId,
      safeIdentifier: second.safeIdentifier,
    };
  }

  const first = result.supportedFirstFactors?.find(
    (f) => f.strategy === "email_code",
  );
  if (first?.emailAddressId) {
    return {
      kind: "first",
      emailAddressId: first.emailAddressId,
      safeIdentifier: first.safeIdentifier,
    };
  }

  return null;
}

export function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({
    strategy: "oauth_apple",
  });
  const {
    scrollRef,
    onScroll,
    bindFieldFocus,
    setFormBlockRef,
    contentPaddingBottom,
    keyboardHeight,
  } = useKeyboardScroll();
  const emailFieldRef = useRef<View>(null);
  const passwordFieldRef = useRef<View>(null);
  const codeFieldRef = useRef<View>(null);
  const codeInputRef = useRef<TextInput>(null);
  const keyboardOpen = keyboardHeight > 0;

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);
  const [verifyFactor, setVerifyFactor] = useState<EmailCodeFactor | null>(
    null,
  );
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  const emailFocus = bindFieldFocus(emailFieldRef);
  const passwordFocus = bindFieldFocus(passwordFieldRef);
  const codeFocus = bindFieldFocus(codeFieldRef);

  useEffect(() => {
    if (Platform.OS === "web") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  useEffect(() => {
    if (resendSecondsLeft <= 0) return;
    const id = setTimeout(() => {
      setResendSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearTimeout(id);
  }, [resendSecondsLeft]);

  const startResendCooldown = () => {
    setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
  };

  const prepareEmailCode = async (factor: EmailCodeFactor) => {
    if (!signIn) throw new Error("Clerk not ready");
    if (factor.kind === "first") {
      if (!factor.emailAddressId) {
        throw new Error("Missing emailAddressId for email_code");
      }
      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: factor.emailAddressId,
      });
      return;
    }
    await signIn.prepareSecondFactor({
      strategy: "email_code",
    });
  };

  const beginEmailCodeStep = async (
    result: {
      status: string | null;
      createdSessionId?: string | null;
      supportedFirstFactors?: Array<{
        strategy: string;
        emailAddressId?: string;
        safeIdentifier?: string;
      }> | null;
      supportedSecondFactors?: Array<{
        strategy: string;
        emailAddressId?: string;
        safeIdentifier?: string;
      }> | null;
    },
  ): Promise<boolean> => {
    const factor = findEmailCodeFactor(result);
    if (!factor) return false;

    console.info("[auth]", "SignInNeedsEmailCode", {
      status: result.status,
      kind: factor.kind,
      safeIdentifier: factor.safeIdentifier ?? null,
      identifier: email.trim(),
    });

    await prepareEmailCode(factor);
    setVerifyFactor(factor);
    setCode("");
    setError(null);
    setStep("verify");
    startResendCooldown();
    setTimeout(() => codeInputRef.current?.focus(), 250);
    return true;
  };

  const onEmailSignIn = async () => {
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError(null);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        logAuthSuccess({
          event: "SignIn",
          provider: "email",
          email: email.trim(),
          createdSession: true,
        });
        return;
      }

      const started = await beginEmailCodeStep(result);
      if (started) return;

      const firstFactors =
        result.supportedFirstFactors?.map((f) => ({
          strategy: f.strategy,
          safeIdentifier:
            "safeIdentifier" in f ? f.safeIdentifier : undefined,
        })) ?? [];
      const secondFactors =
        result.supportedSecondFactors?.map((f) => f.strategy) ?? [];
      console.info("[auth]", "SignInIncomplete", {
        status: result.status,
        createdSessionId: result.createdSessionId ?? null,
        firstFactors,
        secondFactors,
        identifier: email.trim(),
      });
      setError(t("auth.errors.incomplete"));
    } catch (err) {
      console.info("[auth]", "SignInFailed", err);
      setError(getClerkErrorMessage(err, t, "auth.errors.signInFailed"));
    } finally {
      setBusy(false);
    }
  };

  const onVerifyCode = async () => {
    if (!isLoaded || !signIn || !verifyFactor) return;
    const trimmed = code.trim();
    if (!trimmed) {
      setError(t("auth.verificationCodeRequired"));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result =
        verifyFactor.kind === "first"
          ? await signIn.attemptFirstFactor({
              strategy: "email_code",
              code: trimmed,
            })
          : await signIn.attemptSecondFactor({
              strategy: "email_code",
              code: trimmed,
            });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        logAuthSuccess({
          event: "SignIn",
          provider: "email",
          email: email.trim(),
          createdSession: true,
        });
        return;
      }

      // Rare: first factor done, still need second email_code / MFA.
      const continued = await beginEmailCodeStep(result);
      if (continued) return;

      console.info("[auth]", "SignInVerifyIncomplete", {
        status: result.status,
        createdSessionId: result.createdSessionId ?? null,
        kind: verifyFactor.kind,
      });
      setError(t("auth.errors.incomplete"));
    } catch (err) {
      console.info("[auth]", "SignInVerifyFailed", err);
      setError(
        getClerkErrorMessage(err, t, "auth.errors.verificationFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const onResendCode = async () => {
    if (!isLoaded || !signIn || !verifyFactor || resendSecondsLeft > 0) return;
    setBusy(true);
    setError(null);
    try {
      await prepareEmailCode(verifyFactor);
      startResendCooldown();
      console.info("[auth]", "SignInEmailCodeResent", {
        kind: verifyFactor.kind,
        identifier: email.trim(),
      });
    } catch (err) {
      console.info("[auth]", "SignInEmailCodeResendFailed", err);
      setError(
        getClerkErrorMessage(err, t, "auth.errors.verificationFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const onBack = () => {
    if (step === "verify") {
      setStep("credentials");
      setCode("");
      setVerifyFactor(null);
      setError(null);
      setResendSecondsLeft(0);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)");
    }
  };

  const onOAuth = async (provider: "google" | "apple") => {
    setBusy(true);
    setError(null);
    try {
      if (!setActive) throw new Error("Clerk not ready");
      const start =
        provider === "google" ? startGoogleOAuth : startAppleOAuth;
      const { createdSessionId } = await runClerkOAuth({
        startOAuthFlow: start,
      });
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        logAuthSuccess({
          event: "SignIn",
          provider,
          createdSession: true,
        });
      }
    } catch (err) {
      console.info("[auth]", "OAuthFailed", { provider, err });
      setError(
        getClerkErrorMessage(
          err,
          t,
          provider === "google"
            ? "auth.errors.googleFailed"
            : "auth.errors.appleFailed",
        ),
      );
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

  const verifyEmailLabel =
    verifyFactor?.safeIdentifier?.trim() || email.trim();

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
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t("auth.back")}
            style={{
              position: "absolute",
              top: spacing[4],
              left: spacing[6],
              zIndex: 3,
              elevation: 3,
              width: 44,
              height: 44,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: theme.border,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.bg,
            }}
          >
            <BackIcon size={18} />
          </Pressable>

          {!keyboardOpen ? <AuthBrandHero /> : null}

          <Text
            style={{
              ...typography.title,
              color: theme.text,
              textAlign: "center",
              marginTop: keyboardOpen ? spacing[4] : spacing[8],
            }}
          >
            {step === "verify"
              ? t("auth.verifyTitle")
              : t("auth.signInTitle")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing[2],
              marginTop: spacing[2],
              marginBottom: keyboardOpen ? spacing[4] : spacing[8],
              paddingHorizontal: spacing[2],
            }}
          >
            <Text
              style={{
                ...typography.body,
                color: theme.textBody,
                textAlign: "center",
              }}
            >
              {step === "verify"
                ? t("auth.verifySubtitle", { email: verifyEmailLabel })
                : t("auth.signInSubtitle")}
            </Text>
            {step === "credentials" && !keyboardOpen ? (
              <KangurMascot variant="icon" width={28} height={28} />
            ) : null}
          </View>

          {step === "credentials" ? (
            <>
              <View ref={setFormBlockRef} collapsable={false}>
                <View
                  ref={emailFieldRef}
                  collapsable={false}
                  style={{
                    ...fieldShell(emailFocused),
                    marginBottom: spacing[4],
                  }}
                >
                  <MailFieldIcon size={20} />
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
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

                <View
                  ref={passwordFieldRef}
                  collapsable={false}
                  style={fieldShell(passwordFocused)}
                >
                  <LockFieldIcon size={20} />
                  <TextInput
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    placeholder={t("auth.passwordPlaceholder")}
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
                      showPassword
                        ? t("auth.hidePassword")
                        : t("auth.showPassword")
                    }
                  >
                    <EyeIcon size={20} off={showPassword} />
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => {
                    router.push({
                      pathname: "/(auth)/forgot-password",
                      params: email.trim() ? { email: email.trim() } : {},
                    } as never);
                  }}
                  style={{ alignSelf: "flex-end", marginTop: spacing[3] }}
                  accessibilityRole="button"
                  accessibilityLabel={t("auth.forgotPassword")}
                >
                  <Text style={{ ...typography.label, color: theme.primary }}>
                    {t("auth.forgotPassword")}
                  </Text>
                </Pressable>

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
                  onPress={() => void onEmailSignIn()}
                  style={{
                    ...pillPrimary,
                    marginTop: spacing[6],
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  {busy ? (
                    <ActivityIndicator color={theme.onPrimary} />
                  ) : (
                    <Text
                      style={{ ...typography.label, color: theme.onPrimary }}
                    >
                      {t("auth.logIn")}
                    </Text>
                  )}
                </Pressable>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: spacing[5],
                  gap: spacing[3],
                }}
              >
                <View
                  style={{ flex: 1, height: 1, backgroundColor: theme.border }}
                />
                <Text style={{ ...typography.caption, color: theme.textMuted }}>
                  {t("auth.orContinueWith")}
                </Text>
                <View
                  style={{ flex: 1, height: 1, backgroundColor: theme.border }}
                />
              </View>

              <Pressable
                disabled={busy || !isLoaded}
                onPress={() => void onOAuth("google")}
                style={{ ...pillSecondary, opacity: busy ? 0.7 : 1 }}
              >
                {busy ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <>
                    <GoogleIcon size={20} />
                    <Text style={{ ...typography.label, color: theme.text }}>
                      {t("auth.continueGoogle")}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                disabled
                style={{
                  ...pillSecondary,
                  marginTop: spacing[3],
                  opacity: 0.45,
                }}
              >
                <AppleIcon size={20} />
                <Text style={{ ...typography.label, color: theme.text }}>
                  {t("auth.continueApple")}
                </Text>
              </Pressable>

              <View
                style={{
                  marginTop: spacing[5],
                  alignItems: "center",
                }}
              >
                <Text style={{ ...typography.body, color: theme.textBody }}>
                  {t("auth.needAccountPrompt")}{" "}
                  <Link href="/(auth)/sign-up" asChild>
                    <Text style={{ ...typography.label, color: theme.primary }}>
                      {t("auth.signUp")}
                    </Text>
                  </Link>
                </Text>
              </View>
            </>
          ) : (
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
                    letterSpacing: 2,
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
                    {t("auth.verify")}
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
                  opacity: busy || resendSecondsLeft > 0 ? 0.55 : 1,
                }}
                accessibilityRole="button"
                accessibilityLabel={t("auth.resendCode")}
              >
                <Text
                  style={{
                    ...typography.label,
                    color:
                      resendSecondsLeft > 0
                        ? theme.textMuted
                        : theme.primary,
                  }}
                >
                  {resendSecondsLeft > 0
                    ? t("auth.resendCodeIn", { seconds: resendSecondsLeft })
                    : t("auth.resendCode")}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
