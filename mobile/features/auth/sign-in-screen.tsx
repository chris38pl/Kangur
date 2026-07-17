import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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

WebBrowser.maybeCompleteAuthSession();

export function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

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
        console.info("[auth]", "SignIn", { method: "email" });
      } else {
        setError(t("auth.errors.incomplete"));
      }
    } catch (err) {
      console.info("[auth]", "SignInFailed", err);
      setError(getClerkErrorMessage(err, t, "auth.errors.signInFailed"));
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
        console.info("[auth]", "SignIn", { method: "google" });
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

  return (
    <Screen style={{ backgroundColor: theme.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing[6],
            paddingTop: spacing[4],
            paddingBottom: spacing[6],
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => {
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

        <AuthBrandHero />

        <Text
          style={{
            ...typography.title,
            color: theme.text,
            textAlign: "center",
            marginTop: spacing[8],
          }}
        >
          {t("auth.signInTitle")}
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing[2],
            marginTop: spacing[2],
            marginBottom: spacing[8],
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
            {t("auth.signInSubtitle")}
          </Text>
          <KangurMascot variant="icon" width={28} height={28} />
        </View>

        <View style={{ ...fieldShell(emailFocused), marginBottom: spacing[4] }}>
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
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            style={{
              flex: 1,
              color: theme.text,
              fontSize: typography.body.fontSize,
              paddingVertical: spacing[3],
            }}
          />
        </View>

        <View style={fieldShell(passwordFocused)}>
          <LockFieldIcon size={20} />
          <TextInput
            secureTextEntry={!showPassword}
            textContentType="password"
            placeholder={t("auth.passwordPlaceholder")}
            placeholderTextColor={theme.textMuted}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
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

        <Pressable
          disabled
          style={{ alignSelf: "flex-end", marginTop: spacing[3] }}
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
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("auth.logIn")}
            </Text>
          )}
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
            paddingTop: spacing[10],
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
      </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
