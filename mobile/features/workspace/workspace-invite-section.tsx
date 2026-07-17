import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import {
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

type Props = {
  workspaceId: string;
  onEmailFocus?: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WorkspaceInviteSection({ workspaceId, onEmailFocus }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const inviteLink = `https://kangur.app/join/${workspaceId}`;

  const sendInvite = () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      Alert.alert(t("workspace.inviteInvalidEmail"));
      return;
    }
    Alert.alert(
      t("workspace.inviteSentTitle"),
      t("workspace.inviteSentBody", { email: trimmed }),
    );
    setEmail("");
  };

  const copyLink = async () => {
    await Clipboard.setStringAsync(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <View style={{ marginTop: spacing[6] }}>
      <Text style={{ ...typography.headline, color: theme.text }}>
        {t("workspace.inviteTitle")}
      </Text>

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
        onFocus={onEmailFocus}
        style={{ ...fieldStyle, marginTop: spacing[3] }}
      />

      <Pressable
        onPress={sendInvite}
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
        }}
      >
        <Text style={{ fontSize: 16, color: theme.onPrimary }}>✈️</Text>
        <Text style={{ ...typography.label, color: theme.onPrimary }}>
          {t("workspace.inviteSend")}
        </Text>
      </Pressable>

      <View
        style={{
          marginTop: spacing[4],
          backgroundColor: theme.section,
          borderRadius: radius.xl,
          padding: spacing[4],
        }}
      >
        <Text style={{ ...typography.headline, color: theme.text }}>
          {t("workspace.shareLinkTitle")}
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: theme.textBody,
            marginTop: spacing[1],
            lineHeight: 18,
          }}
        >
          {t("workspace.shareLinkBody")}
        </Text>
        <Pressable
          onPress={() => void copyLink()}
          accessibilityRole="button"
          style={{
            marginTop: spacing[4],
            alignSelf: "center",
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: radius.md,
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[5],
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[2],
            minWidth: 160,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 15 }}>🔗</Text>
          <Text style={{ ...typography.label, color: theme.text }}>
            {copied ? t("workspace.linkCopied") : t("workspace.copyLink")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
