import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { primaryButtonStyle } from "@/design-system/shopping-density";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { useMe } from "@/features/auth/useMe";
import {
  getPlatformFeedback,
  updatePlatformFeedback,
} from "@/features/feedback/api";
import type { FeedbackStatus } from "@/features/feedback/schemas";
import { useKeyboardScroll } from "@/hooks/useKeyboardScroll";
import { LOCALE_META } from "@/lib/i18n/locales";

const STATUSES: FeedbackStatus[] = [
  "NEW",
  "TRIAGED",
  "IN_PROGRESS",
  "DONE",
  "RELEASED",
];

function MetaRow({ label, value }: { label: string; value: string | null }) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  if (!value) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: spacing[3],
        paddingVertical: spacing[2],
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}
    >
      <Text style={{ ...typography.caption, color: theme.textMuted }}>{label}</Text>
      <Text
        style={{
          ...typography.caption,
          color: theme.text,
          flex: 1,
          textAlign: "right",
        }}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

export function PlatformFeedbackDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { feedbackId } = useLocalSearchParams<{ feedbackId: string }>();
  const { getToken } = useAuth();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const {
    scrollRef,
    onScroll,
    bindFieldFocus,
    setFormBlockRef,
    contentPaddingBottom,
  } = useKeyboardScroll();
  const adminNoteFieldRef = useRef<View>(null);
  const adminNoteFocus = bindFieldFocus(adminNoteFieldRef);

  const isAdmin = me?.platformRole === "ADMIN";

  const detailQuery = useQuery({
    queryKey: ["platform-feedback", feedbackId],
    enabled: isAdmin && Boolean(feedbackId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !feedbackId) throw new Error("Missing auth or id");
      return getPlatformFeedback(token, feedbackId);
    },
  });

  const [status, setStatus] = useState<FeedbackStatus>("NEW");
  const [adminNote, setAdminNote] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!detailQuery.data) return;
    const next = detailQuery.data;
    // Defer so we don't sync-setState inside the effect body (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      setStatus(next.status);
      setAdminNote(next.adminNote ?? "");
    });
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !feedbackId) throw new Error("Missing auth or id");
      return updatePlatformFeedback(token, feedbackId, {
        status,
        adminNote: adminNote.trim() ? adminNote.trim() : null,
      });
    },
    onSuccess: async (feedback) => {
      queryClient.setQueryData(["platform-feedback", feedbackId], feedback);
      await queryClient.invalidateQueries({ queryKey: ["platform-feedback"] });
      setSaveMessage(t("platformFeedback.saved"));
    },
    onError: () => {
      setSaveMessage(t("platformFeedback.saveFailed"));
    },
  });

  if (!isAdmin) {
    return (
      <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
        <View style={{ padding: spacing[4] }}>
          <Pressable onPress={() => router.back()}>
            <BackIcon color={theme.text} />
          </Pressable>
          <Text
            style={{
              ...typography.body,
              color: theme.textMuted,
              marginTop: spacing[4],
            }}
          >
            {t("platformFeedback.forbidden")}
          </Text>
        </View>
      </Screen>
    );
  }

  const item = detailQuery.data;
  const lang =
    item && item.language in LOCALE_META
      ? LOCALE_META[item.language as keyof typeof LOCALE_META]
      : null;

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[3],
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[3],
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          hitSlop={12}
        >
          <BackIcon color={theme.text} />
        </Pressable>
        <Text
          style={{ ...typography.title, color: theme.text, flex: 1 }}
          numberOfLines={1}
        >
          {item?.title ?? t("platformFeedback.title")}
        </Text>
      </View>

      {detailQuery.isLoading || !item ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: spacing[8] }} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
        <ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{
            paddingHorizontal: spacing[4],
            paddingBottom: contentPaddingBottom,
            gap: spacing[4],
          }}
        >
          <View style={{ flexDirection: "row", gap: spacing[2], flexWrap: "wrap" }}>
            <Text style={{ ...typography.caption, color: theme.primary, fontWeight: "700" }}>
              {item.type === "BUG"
                ? t("platformFeedback.typeBug")
                : t("platformFeedback.typeIdea")}
            </Text>
            {item.hasAttachment ? <Text>📷</Text> : null}
          </View>

          <View style={{ gap: spacing[2] }}>
            <Text style={{ ...typography.caption, color: theme.textMuted }}>
              {t("platformFeedback.description")}
            </Text>
            <Text style={{ ...typography.body, color: theme.text }}>
              {item.description}
            </Text>
          </View>

          <View style={{ gap: spacing[2] }}>
            <Text style={{ ...typography.caption, color: theme.textMuted }}>
              {t("platformFeedback.attachment")}
            </Text>
            {item.attachmentUrl ? (
              <Image
                source={{ uri: item.attachmentUrl }}
                style={{
                  width: "100%",
                  height: 220,
                  borderRadius: radius.md,
                  backgroundColor: theme.section,
                }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ ...typography.caption, color: theme.textMuted }}>
                {t("platformFeedback.noAttachment")}
              </Text>
            )}
          </View>

          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: theme.border,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[2],
            }}
          >
            <Text
              style={{
                ...typography.caption,
                fontWeight: "700",
                color: theme.text,
                marginBottom: spacing[2],
              }}
            >
              {t("platformFeedback.metadata")}
            </Text>
            <MetaRow label={t("platformFeedback.user")} value={item.user?.email ?? item.userId} />
            <MetaRow
              label={t("platformFeedback.language")}
              value={lang ? `${lang.emoji} ${lang.nativeName}` : item.language}
            />
            <MetaRow
              label={t("platformFeedback.created")}
              value={new Date(item.createdAt).toLocaleString()}
            />
            <MetaRow label={t("platformFeedback.appVersion")} value={item.appVersion} />
            <MetaRow label="Build" value={item.buildNumber} />
            <MetaRow label="Platform" value={item.platform} />
            <MetaRow label="Device" value={item.deviceModel} />
            <MetaRow label="OS" value={item.osVersion} />
            <MetaRow label="Environment" value={item.environment} />
            <MetaRow label="API" value={item.apiBaseUrl} />
            <MetaRow label="Route" value={item.route} />
            <MetaRow label="Workspace" value={item.workspaceId} />
            <MetaRow label="List" value={item.listId} />
            <MetaRow label="Session" value={item.shoppingSessionId} />
            <MetaRow label="metadataVersion" value={String(item.metadataVersion)} />
          </View>

          <View style={{ gap: spacing[2] }}>
            <Text style={{ ...typography.caption, color: theme.textMuted }}>
              {t("platformFeedback.status")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[2] }}>
              {STATUSES.map((s) => {
                const selected = status === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => {
                      setStatus(s);
                      setSaveMessage(null);
                    }}
                    style={{
                      paddingVertical: spacing[2],
                      paddingHorizontal: spacing[3],
                      borderRadius: radius.full,
                      borderWidth: 1.5,
                      borderColor: selected ? theme.primary : theme.border,
                      backgroundColor: theme.surface,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        fontWeight: selected ? "700" : "500",
                        color: selected ? theme.primary : theme.text,
                      }}
                    >
                      {t(`platformFeedback.statuses.${s}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View ref={setFormBlockRef} style={{ gap: spacing[4] }}>
            <View ref={adminNoteFieldRef} style={{ gap: spacing[2] }}>
              <Text style={{ ...typography.caption, color: theme.textMuted }}>
                {t("platformFeedback.adminNote")}
              </Text>
              <TextInput
                value={adminNote}
                onChangeText={(v) => {
                  setAdminNote(v);
                  setSaveMessage(null);
                }}
                onFocus={adminNoteFocus.onFocus}
                onBlur={adminNoteFocus.onBlur}
                multiline
                textAlignVertical="top"
                placeholder={t("platformFeedback.adminNotePlaceholder")}
                placeholderTextColor={theme.textMuted}
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  borderRadius: radius.md,
                  padding: spacing[4],
                  minHeight: 100,
                  ...typography.body,
                  color: theme.text,
                }}
              />
            </View>

            {saveMessage ? (
              <Text
                style={{
                  ...typography.caption,
                  color:
                    saveMessage === t("platformFeedback.saved")
                      ? theme.primary
                      : theme.danger,
                }}
              >
                {saveMessage}
              </Text>
            ) : null}

            <Pressable
              onPress={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              style={{
                ...primaryButtonStyle(theme),
                opacity: saveMutation.isPending ? 0.6 : 1,
              }}
            >
              {saveMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    ...typography.body,
                    fontWeight: "700",
                    color: "#fff",
                    textAlign: "center",
                  }}
                >
                  {t("platformFeedback.save")}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}
