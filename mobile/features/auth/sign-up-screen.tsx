import { useOAuth, useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useRef, useState } from "react";
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
  inputStyle,
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
  MailIcon,
} from "@/features/auth/auth-icons";
import { useKeyboardScroll } from "@/hooks/useKeyboardScroll";

type Step = "landing" | "email" | "verify";

export function SignUpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
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
  const nameFieldRef = useRef<View>(null);
  const codeFieldRef = useRef<View>(null);
  const keyboardOpen = keyboardHeight > 0;

  const [step, setStep] = useState<Step>("landing");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nameFocus = bindFieldFocus(nameFieldRef);
  const emailFocus = bindFieldFocus(emailFieldRef);
  const passwordFocus = bindFieldFocus(passwordFieldRef);
  const codeFocus = bindFieldFocus(codeFieldRef);

  const splitFullName = (value: string) => {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ");
    return { firstName, lastName };
  };

  const onSignUp = async () => {
    if (!isLoaded || !signUp) return;

    const { firstName, lastName } = splitFullName(fullName);
    if (!firstName) {
      setError(t("auth.nameRequired"));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName,
        ...(lastName ? { lastName } : {}),
      });

      if (signUp.status === "complete" && signUp.createdSessionId) {
        await setActive({ session: signUp.createdSessionId });
        console.info("[auth]", "SignUp", { method: "email" });
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err) {
      console.info("[auth]", "SignUpFailed", err);
      setError(getClerkErrorMessage(err, t, "auth.errors.signUpFailed"));
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    if (!isLoaded || !signUp) return;
    setBusy(true);
    setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        console.info("[auth]", "SignUp", { method: "email", verified: true });
        return;
      }

      setError(t("auth.errors.incomplete"));
    } catch (err) {
      console.info("[auth]", "SignUpVerifyFailed", err);
      setError(getClerkErrorMessage(err, t, "auth.errors.verificationFailed"));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      const { createdSessionId, setActive: setOAuthActive } =
        await startOAuthFlow({
          redirectUrl: Linking.createURL("/"),
        });
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        console.info("[auth]", "SignUp", { method: "google" });
      }
    } catch (err) {
      console.info("[auth]", "GoogleFailed", err);
      setError(getClerkErrorMessage(err, t, "auth.errors.googleFailed"));
    } finally {
      setBusy(false);
    }
  };

  const pillPrimary = {
    ...primaryButtonStyle(theme),
    borderRadius: radius.full,
    flexDirection: "row" as const,
    gap: spacing[2],
  };

  const pillSecondary = {
    ...secondaryButtonStyle(theme),
    borderRadius: radius.full,
    flexDirection: "row" as const,
    gap: spacing[2],
  };

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
            if (step === "verify") {
              setError(null);
              setStep("email");
              return;
            }
            if (step === "email") {
              setError(null);
              setStep("landing");
              return;
            }
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(auth)");
            }
          }}
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

      {step === "landing" ? (
        <>
          <Text
            style={{
              ...typography.title,
              color: theme.text,
              textAlign: "center",
              marginTop: spacing[8],
            }}
          >
            {t("auth.signUpHeroTitle")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              textAlign: "center",
              marginTop: spacing[2],
              marginBottom: spacing[8],
              paddingHorizontal: spacing[2],
            }}
          >
            {t("auth.signUpHeroSubtitle")}
          </Text>

          {error ? (
            <Text
              style={{
                ...typography.caption,
                color: theme.danger,
                textAlign: "center",
                marginBottom: spacing[3],
              }}
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            disabled={busy || !isLoaded}
            onPress={() => {
              setError(null);
              setStep("email");
            }}
            style={{ ...pillPrimary, opacity: busy ? 0.7 : 1 }}
          >
            <MailIcon size={20} />
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("auth.signUpWithEmail")}
            </Text>
          </Pressable>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: spacing[5],
              gap: spacing[3],
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
            <Text style={{ ...typography.caption, color: theme.textMuted }}>
              {t("auth.orContinueWith")}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
          </View>

          <Pressable
            disabled={busy || !isLoaded}
            onPress={() => void onGoogle()}
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
              {t("auth.haveAccountPrompt")}{" "}
              <Link href="/(auth)/sign-in" asChild>
                <Text style={{ ...typography.label, color: theme.primary }}>
                  {t("auth.logIn")}
                </Text>
              </Link>
            </Text>
          </View>
        </>
      ) : null}

      {step === "email" || step === "verify" ? (
        <>
          <Text
            style={{
              ...typography.title,
              color: theme.text,
              textAlign: "center",
              marginTop: keyboardOpen ? spacing[4] : spacing[8],
            }}
          >
            {step === "verify" ? t("auth.verifyTitle") : t("auth.signUpTitle")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              textAlign: "center",
              marginTop: spacing[2],
              marginBottom: keyboardOpen ? spacing[4] : spacing[6],
            }}
          >
            {step === "verify"
              ? t("auth.verifySubtitle", { email: email.trim() })
              : t("auth.signUpEmailSubtitle")}
          </Text>

          {step === "email" ? (
            <View ref={setFormBlockRef} collapsable={false}>
              <View
                ref={nameFieldRef}
                collapsable={false}
                style={{ marginBottom: spacing[3] }}
              >
                <TextInput
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  placeholder={t("auth.fullNamePlaceholder")}
                  placeholderTextColor={theme.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={nameFocus.onFocus}
                  onBlur={nameFocus.onBlur}
                  style={inputStyle(theme)}
                />
              </View>
              <View
                ref={emailFieldRef}
                collapsable={false}
                style={{ marginBottom: spacing[3] }}
              >
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder={t("auth.email")}
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={emailFocus.onFocus}
                  onBlur={emailFocus.onBlur}
                  style={inputStyle(theme)}
                />
              </View>
              <View
                ref={passwordFieldRef}
                collapsable={false}
                style={{
                  ...inputStyle(theme),
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: spacing[4],
                  paddingVertical: 0,
                }}
              >
                <TextInput
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  placeholder={t("auth.password")}
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={passwordFocus.onFocus}
                  onBlur={passwordFocus.onBlur}
                  style={{
                    flex: 1,
                    color: theme.text,
                    fontSize: typography.body.fontSize,
                    paddingVertical: spacing[4],
                    paddingRight: spacing[2],
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
                onPress={() => void onSignUp()}
                style={{ ...pillPrimary, opacity: busy ? 0.7 : 1 }}
              >
                {busy ? (
                  <ActivityIndicator color={theme.onPrimary} />
                ) : (
                  <Text style={{ ...typography.label, color: theme.onPrimary }}>
                    {t("auth.signUp")}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View ref={setFormBlockRef} collapsable={false}>
              <View
                ref={codeFieldRef}
                collapsable={false}
                style={{ marginBottom: spacing[4] }}
              >
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  placeholder={t("auth.verificationCode")}
                  placeholderTextColor={theme.textMuted}
                  value={code}
                  onChangeText={setCode}
                  onFocus={codeFocus.onFocus}
                  onBlur={codeFocus.onBlur}
                  style={inputStyle(theme)}
                />
              </View>

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
                onPress={() => void onVerify()}
                style={{ ...pillPrimary, opacity: busy ? 0.7 : 1 }}
              >
                {busy ? (
                  <ActivityIndicator color={theme.onPrimary} />
                ) : (
                  <Text style={{ ...typography.label, color: theme.onPrimary }}>
                    {t("auth.verify")}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </>
      ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
