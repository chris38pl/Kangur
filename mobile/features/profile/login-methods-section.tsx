import { useOAuth, useUser } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { FeedbackSheet } from "@/components/feedback-sheet";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { AppleIcon, GoogleIcon } from "@/features/auth/auth-icons";
import { getClerkErrorMessage } from "@/features/auth/clerk-error";
import { logAuthSuccess } from "@/features/auth/oauth";

function Card({ children }: { children: ReactNode }) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

function MethodRow({
  icon,
  title,
  subtitle,
  active,
  showDivider,
  trailing,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  active: boolean;
  showDivider?: boolean;
  trailing?: ReactNode;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        width: "100%",
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: theme.border,
        gap: spacing[3],
      }}
    >
      <Text
        style={{
          ...typography.label,
          color: active ? theme.primary : theme.textMuted,
          width: 20,
          textAlign: "center",
        }}
      >
        {active ? "✓" : "○"}
      </Text>

      {icon ? (
        <View
          style={{
            width: 24,
            height: 24,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
      ) : null}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            ...typography.body,
            color: theme.text,
            fontWeight: "500",
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing}
    </View>
  );
}

/**
 * Login methods + password UX for account details (email / Google / Apple).
 */
export function LoginMethodsSection() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({
    strategy: "oauth_apple",
  });
  const [busyProvider, setBusyProvider] = useState<"google" | "apple" | null>(
    null,
  );
  const [disconnectTarget, setDisconnectTarget] = useState<
    "google" | "apple" | null
  >(null);

  if (!isLoaded || !user) {
    return (
      <ActivityIndicator
        color={theme.primary}
        style={{ marginTop: spacing[6] }}
      />
    );
  }

  const passwordEnabled = user.passwordEnabled;
  const googleAccount = user.externalAccounts.find(
    (account) => account.provider === "google",
  );
  const appleAccount = user.externalAccounts.find(
    (account) => account.provider === "apple",
  );
  const hasGoogle = Boolean(googleAccount);
  const hasApple = Boolean(appleAccount);
  const oauthCount = (hasGoogle ? 1 : 0) + (hasApple ? 1 : 0);
  const methodCount = (passwordEnabled ? 1 : 0) + oauthCount;
  const emailOnly = passwordEnabled && oauthCount === 0;
  const oauthOnlyNoPassword = !passwordEnabled && oauthCount >= 1;
  const multi = methodCount > 1;

  const openChangePassword = () => {
    router.push("/change-password");
  };

  const canDisconnectOAuth = passwordEnabled || oauthCount > 1;

  const confirmDisconnect = (provider: "google" | "apple") => {
    const account = provider === "google" ? googleAccount : appleAccount;
    if (!account || !canDisconnectOAuth) return;
    setDisconnectTarget(provider);
  };

  const runDisconnect = async () => {
    const provider = disconnectTarget;
    if (!provider) return;
    const account = provider === "google" ? googleAccount : appleAccount;
    if (!account) {
      setDisconnectTarget(null);
      return;
    }
    setBusyProvider(provider);
    try {
      await account.destroy();
      await user.reload();
      setDisconnectTarget(null);
    } catch (err) {
      Alert.alert(getClerkErrorMessage(err, t, "profile.disconnectFailed"));
    } finally {
      setBusyProvider(null);
    }
  };

  const connectProvider = async (provider: "google" | "apple") => {
    setBusyProvider(provider);
    try {
      const start =
        provider === "google" ? startGoogleOAuth : startAppleOAuth;
      const { createdSessionId, setActive } = await start({
        redirectUrl: Linking.createURL("/account"),
      });

      // Linking into existing account keeps the same Clerk user.id.
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
      await user.reload();
      logAuthSuccess({
        event: "LinkProvider",
        provider,
        email: user.primaryEmailAddress?.emailAddress ?? null,
        userId: user.id,
        createdSession: Boolean(createdSessionId),
      });
    } catch (err) {
      console.info("[auth]", "LinkProviderFailed", { provider, err });
      Alert.alert(getClerkErrorMessage(err, t, "profile.connectFailed"));
    } finally {
      setBusyProvider(null);
    }
  };

  const linkAction = (
    provider: "google" | "apple",
    connected: boolean,
  ): ReactNode => {
    if (busyProvider === provider) {
      return <ActivityIndicator color={theme.primary} size="small" />;
    }
    if (connected) {
      if (!canDisconnectOAuth) return null;
      return (
        <Pressable onPress={() => confirmDisconnect(provider)} hitSlop={8}>
          <Text style={{ ...typography.label, color: theme.danger }}>
            {t("profile.disconnect")}
          </Text>
        </Pressable>
      );
    }
    return (
      <Pressable onPress={() => void connectProvider(provider)} hitSlop={8}>
        <Text style={{ ...typography.label, color: theme.primary }}>
          {t("profile.connect")}
        </Text>
      </Pressable>
    );
  };

  const disconnectSheet = (
    <FeedbackSheet
      visible={disconnectTarget != null}
      image={brandAssets.silentMode}
      title={t("profile.disconnectTitle", {
        provider: t(
          disconnectTarget === "apple"
            ? "profile.providerApple"
            : "profile.providerGoogle",
        ),
      })}
      body={t("profile.disconnectBody")}
      primaryLabel={t("profile.disconnectConfirm")}
      onPrimary={() => void runDisconnect()}
      secondaryLabel={t("workspace.cancel")}
      onSecondary={() => {
        if (!busyProvider) setDisconnectTarget(null);
      }}
      primaryDestructive
      busy={busyProvider != null && disconnectTarget != null}
    />
  );

  // 1) Email + password only — still offer connect Google / Apple (same Clerk user).
  if (emailOnly) {
    return (
      <>
        <View style={{ marginTop: spacing[6] }}>
          <Text
            style={{
              ...typography.headline,
              color: theme.text,
              marginBottom: spacing[3],
            }}
          >
            {t("profile.loginMethods")}
          </Text>
          <Card>
            <MethodRow
              active={hasGoogle}
              icon={<GoogleIcon size={20} />}
              title={t("profile.providerGoogle")}
              showDivider
              trailing={linkAction("google", hasGoogle)}
            />
            <MethodRow
              active={hasApple}
              icon={<AppleIcon size={20} />}
              title={t("profile.providerApple")}
              trailing={linkAction("apple", hasApple)}
            />
          </Card>
        </View>
        {disconnectSheet}
      </>
    );
  }

  // 2/3) Single OAuth provider, no password - managed by provider + offer set password
  if (oauthOnlyNoPassword && oauthCount === 1) {
    const provider = hasGoogle ? "google" : "apple";
    const providerLabel = t(
      provider === "google" ? "profile.providerGoogle" : "profile.providerApple",
    );

    return (
      <>
        <View style={{ marginTop: spacing[6] }}>
          <Text
            style={{
              ...typography.headline,
              color: theme.text,
              marginBottom: spacing[3],
            }}
          >
            {t("profile.loginMethod")}
          </Text>
          <Card>
            <MethodRow
              active
              icon={
                provider === "google" ? (
                  <GoogleIcon size={20} />
                ) : (
                  <AppleIcon size={20} />
                )
              }
              title={providerLabel}
              showDivider
            />
            <MethodRow
              active={false}
              title={t("profile.passwordNotSet")}
              trailing={
                <Pressable onPress={openChangePassword} hitSlop={8}>
                  <Text style={{ ...typography.label, color: theme.primary }}>
                    {t("profile.setPasswordTitle")}
                  </Text>
                </Pressable>
              }
            />
          </Card>
        </View>
        {disconnectSheet}
      </>
    );
  }

  // 4/5) Multiple methods (or OAuth + password / both OAuth)
  return (
    <>
      <View style={{ marginTop: spacing[6] }}>
        <Text
          style={{
            ...typography.headline,
            color: theme.text,
            marginBottom: spacing[3],
          }}
        >
          {multi || oauthCount > 0
            ? t("profile.loginMethods")
            : t("profile.loginMethod")}
        </Text>
        <Card>
          <MethodRow
            active={passwordEnabled}
            title={t("profile.methodEmailPassword")}
            subtitle={
              passwordEnabled
                ? t("profile.passwordMasked")
                : t("profile.passwordNotSet")
            }
            showDivider
            trailing={
              <Pressable onPress={openChangePassword} hitSlop={8}>
                <Text style={{ ...typography.label, color: theme.primary }}>
                  {passwordEnabled
                    ? t("profile.changePassword")
                    : t("profile.setPasswordTitle")}
                </Text>
              </Pressable>
            }
          />
          <MethodRow
            active={hasGoogle}
            icon={<GoogleIcon size={20} />}
            title={t("profile.providerGoogle")}
            showDivider
            trailing={linkAction("google", hasGoogle)}
          />
          <MethodRow
            active={hasApple}
            icon={<AppleIcon size={20} />}
            title={t("profile.providerApple")}
            trailing={linkAction("apple", hasApple)}
          />
        </Card>
      </View>
      {disconnectSheet}
    </>
  );
}

/** Password row for email-only accounts (shown inside the main account card). */
export function EmailOnlyPasswordRow({ showDivider }: { showDivider?: boolean }) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const router = useRouter();
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) return null;

  const passwordEnabled = user.passwordEnabled;
  const hasOAuth = user.externalAccounts.some(
    (account) =>
      account.provider === "google" || account.provider === "apple",
  );

  if (!passwordEnabled || hasOAuth) return null;

  return (
    <View
      style={{
        width: "100%",
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing[4],
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: theme.border,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, paddingVertical: spacing[3] }}>
        <Text style={{ ...typography.caption, color: theme.textMuted }}>
          {t("profile.passwordLabel")}
        </Text>
        <Text
          style={{
            ...typography.body,
            color: theme.text,
            fontWeight: "600",
            marginTop: 2,
          }}
        >
          {t("profile.passwordMasked")}
        </Text>
      </View>
      <Pressable onPress={() => router.push("/change-password")} hitSlop={8}>
        <Text style={{ ...typography.label, color: theme.primary }}>
          {t("profile.changePassword")}
        </Text>
      </Pressable>
    </View>
  );
}
