import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { primaryButtonStyle } from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import {
  BackIcon,
  EyeIcon,
  LockFieldIcon,
} from "@/features/auth/auth-icons";
import { getClerkErrorMessage } from "@/features/auth/clerk-error";

/**
 * Change / set password via Clerk `user.updatePassword`.
 */
export function ChangePasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const { user, isLoaded } = useUser();

  const passwordEnabled = user?.passwordEnabled ?? false;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentFocused, setCurrentFocused] = useState(false);
  const [newFocused, setNewFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fieldShell = (focused: boolean) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing[3],
    borderWidth: 1,
    borderColor: focused ? theme.primary : theme.border,
    backgroundColor: theme.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    minHeight: 56,
  });

  const onSubmit = async () => {
    if (!isLoaded || !user) return;

    const next = newPassword.trim();
    const confirm = confirmPassword.trim();
    const current = currentPassword.trim();

    if (passwordEnabled && !current) {
      setError(t("profile.changePasswordCurrentRequired"));
      return;
    }
    if (next.length < 8) {
      setError(t("profile.changePasswordTooShort"));
      return;
    }
    if (next !== confirm) {
      setError(t("profile.changePasswordMismatch"));
      return;
    }
    if (passwordEnabled && current === next) {
      setError(t("profile.changePasswordSameAsCurrent"));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await user.updatePassword({
        ...(passwordEnabled ? { currentPassword: current } : {}),
        newPassword: next,
        signOutOfOtherSessions: true,
      });
      console.info("[auth]", "PasswordUpdated", { clerkId: user.id });
      router.back();
    } catch (err) {
      console.info("[auth]", "PasswordUpdateFailed", err);
      setError(
        getClerkErrorMessage(err, t, "profile.changePasswordFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    (!passwordEnabled || currentPassword.length > 0) &&
    !busy;

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.bg,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            minHeight: 40,
          }}
        >
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/account");
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("auth.back")}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <BackIcon size={20} />
          </Pressable>

          <Text
            numberOfLines={1}
            style={{
              ...typography.headline,
              color: theme.text,
              position: "absolute",
              left: 48,
              right: 48,
              textAlign: "center",
            }}
          >
            {passwordEnabled
              ? t("profile.changePasswordTitle")
              : t("profile.setPasswordTitle")}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: spacing[6],
            paddingTop: spacing[6],
            paddingBottom: Math.max(insets.bottom, spacing[4]) + spacing[6],
          }}
        >
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              marginBottom: spacing[5],
            }}
          >
            {passwordEnabled
              ? t("profile.changePasswordSubtitle")
              : t("profile.setPasswordSubtitle")}
          </Text>

          {passwordEnabled ? (
            <View style={{ ...fieldShell(currentFocused), marginBottom: spacing[4] }}>
              <LockFieldIcon size={20} />
              <TextInput
                secureTextEntry={!showCurrent}
                textContentType="password"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={t("profile.currentPasswordPlaceholder")}
                placeholderTextColor={theme.textMuted}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                onFocus={() => setCurrentFocused(true)}
                onBlur={() => setCurrentFocused(false)}
                style={{
                  flex: 1,
                  color: theme.text,
                  fontSize: typography.body.fontSize,
                  paddingVertical: spacing[3],
                }}
              />
              <Pressable
                onPress={() => setShowCurrent((v) => !v)}
                hitSlop={8}
                accessibilityRole="button"
              >
                <EyeIcon size={20} off={showCurrent} />
              </Pressable>
            </View>
          ) : null}

          <View style={{ ...fieldShell(newFocused), marginBottom: spacing[4] }}>
            <LockFieldIcon size={20} />
            <TextInput
              secureTextEntry={!showNew}
              textContentType="newPassword"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("profile.newPasswordPlaceholder")}
              placeholderTextColor={theme.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
              onFocus={() => setNewFocused(true)}
              onBlur={() => setNewFocused(false)}
              style={{
                flex: 1,
                color: theme.text,
                fontSize: typography.body.fontSize,
                paddingVertical: spacing[3],
              }}
            />
            <Pressable
              onPress={() => setShowNew((v) => !v)}
              hitSlop={8}
              accessibilityRole="button"
            >
              <EyeIcon size={20} off={showNew} />
            </Pressable>
          </View>

          <View style={fieldShell(confirmFocused)}>
            <LockFieldIcon size={20} />
            <TextInput
              secureTextEntry={!showConfirm}
              textContentType="newPassword"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("profile.confirmPasswordPlaceholder")}
              placeholderTextColor={theme.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
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
              }}
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            disabled={!canSubmit}
            onPress={() => void onSubmit()}
            style={{
              ...primaryButtonStyle(theme),
              marginTop: spacing[6],
              opacity: canSubmit ? 1 : 0.5,
            }}
          >
            {busy ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <Text style={{ ...typography.label, color: theme.onPrimary }}>
                {passwordEnabled
                  ? t("profile.changePasswordSave")
                  : t("profile.setPasswordSave")}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
