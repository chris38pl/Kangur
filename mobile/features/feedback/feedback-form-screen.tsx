import { useAuth } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { openSettings } from "expo-linking";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppResultScreen } from "@/components/AppResultScreen";
import { FeedbackSheet } from "@/components/feedback-sheet";
import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { primaryButtonStyle } from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import {
  SUPPORTED_LOCALES,
  type AppLocale,
  resolveAppLocale,
} from "@/lib/i18n/locales";
import { ApiClientError } from "@/lib/api/client";
import {
  ACTIVE_WORKSPACE_ID_QUERY_KEY,
} from "@/features/workspace/useActiveWorkspace";

import { buildFeedbackPayload } from "./build-feedback-payload";
import type { FeedbackType } from "./schemas";
import { useSubmitFeedback } from "./useSubmitFeedback";
import { toUploadThingRnFile, useUploadThing } from "./uploadthing";

type LocalImage = {
  uri: string;
  mimeType: string;
  fileName: string;
};

function parseType(raw: string | string[] | undefined): FeedbackType {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "FEATURE_REQUEST" ? "FEATURE_REQUEST" : "BUG";
}

export function FeedbackFormScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ type?: string }>();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const submit = useSubmitFeedback();

  const [type, setType] = useState<FeedbackType>(() => parseType(params.type));
  const [language, setLanguage] = useState<AppLocale>(() =>
    resolveAppLocale(i18n.language),
  );
  const [languageOpen, setLanguageOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [localImage, setLocalImage] = useState<LocalImage | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const workspaceQuery = useQuery({
    queryKey: ACTIVE_WORKSPACE_ID_QUERY_KEY,
    queryFn: async () => AsyncStorage.getItem("kangur.activeWorkspaceId"),
    staleTime: Infinity,
  });

  const { startUpload, isUploading } = useUploadThing("feedbackImage", {
    headers: async () => {
      const token = await getToken();
      if (!token) return {} as Record<string, string>;
      return { Authorization: `Bearer ${token}` };
    },
  });

  const screenTitle =
    type === "BUG" ? t("feedback.reportProblem") : t("feedback.haveIdea");

  const selectedLocaleMeta = useMemo(
    () => SUPPORTED_LOCALES.find((l) => l.id === language),
    [language],
  );

  const busy = submitting || isUploading || submit.isPending;
  const canSubmit =
    title.trim().length > 0 && description.trim().length > 0 && !busy;

  const pickImage = async (source: "library" | "camera") => {
    setUploadError(null);
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(t("feedback.permissionTitle"), t("feedback.permissionBody"), [
        { text: t("common.cancel") },
        {
          text: t("feedback.openSettings"),
          onPress: () => void openSettings(),
        },
      ]);
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.85,
          });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setLocalImage({
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
      fileName: asset.fileName ?? `feedback-${Date.now()}.jpg`,
    });
  };

  const onAttachPress = () => {
    setPhotoSourceOpen(true);
  };

  const onPickPhotoSource = (source: "library" | "camera") => {
    setPhotoSourceOpen(false);
    void pickImage(source);
  };

  const onSubmit = async () => {
    if (!canSubmit) return;
    setFormError(null);
    setUploadError(null);
    setSubmitting(true);

    let attachmentKey: string | null = null;
    let attachmentUrl: string | null = null;

    try {
      if (localImage) {
        const rnFile = await toUploadThingRnFile(localImage);
        const uploaded = await startUpload([rnFile]);

        const file = uploaded?.[0];
        const key =
          (file as { key?: string } | undefined)?.key ??
          (file as { serverData?: { key?: string } } | undefined)?.serverData
            ?.key ??
          null;
        const url =
          (file as { ufsUrl?: string; url?: string } | undefined)?.ufsUrl ??
          (file as { url?: string } | undefined)?.url ??
          (file as { serverData?: { url?: string } } | undefined)?.serverData
            ?.url ??
          null;

        if (!key || !url) {
          setUploadError(t("feedback.uploadFailed"));
          setSubmitting(false);
          return;
        }
        attachmentKey = key;
        attachmentUrl = url;
      }

      const payload = buildFeedbackPayload({
        type,
        title: title.trim(),
        description: description.trim(),
        language,
        attachmentKey,
        attachmentUrl,
        workspaceId: workspaceQuery.data,
        route: pathname || null,
      });

      await submit.mutateAsync(payload);
      setSuccessOpen(true);
    } catch (err) {
      if (localImage && !(err instanceof ApiClientError)) {
        setUploadError(t("feedback.uploadFailed"));
      } else {
        setFormError(
          err instanceof ApiClientError
            ? err.message
            : t("feedback.submitFailed"),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fieldShell = (focused?: boolean) => ({
    borderWidth: 1,
    borderColor: focused ? theme.primary : theme.border,
    backgroundColor: theme.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  });

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
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/profile")
          }
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          hitSlop={12}
        >
          <BackIcon color={theme.text} />
        </Pressable>
        <Text
          style={{
            ...typography.title,
            color: theme.text,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {screenTitle}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: spacing[4],
            paddingBottom: insets.bottom + spacing[8],
            gap: spacing[4],
          }}
        >
          <View style={{ gap: spacing[2] }}>
            <Text style={{ ...typography.caption, color: theme.textMuted }}>
              {t("feedback.typeLabel")}
            </Text>
            <View style={{ flexDirection: "row", gap: spacing[2] }}>
              {(
                [
                  { id: "BUG" as const, label: t("feedback.reportProblem") },
                  {
                    id: "FEATURE_REQUEST" as const,
                    label: t("feedback.haveIdea"),
                  },
                ] as const
              ).map((option) => {
                const selected = type === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setType(option.id)}
                    disabled={busy}
                    style={{
                      flex: 1,
                      paddingVertical: spacing[3],
                      paddingHorizontal: spacing[2],
                      borderRadius: radius.md,
                      borderWidth: 1.5,
                      borderColor: selected ? theme.primary : theme.border,
                      backgroundColor: theme.surface,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        fontWeight: selected ? "700" : "500",
                        color: selected ? theme.primary : theme.text,
                        textAlign: "center",
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: spacing[2] }}>
            <Text style={{ ...typography.caption, color: theme.textMuted }}>
              {t("feedback.languageLabel")}
            </Text>
            <Pressable
              onPress={() => setLanguageOpen(true)}
              disabled={busy}
              style={fieldShell()}
            >
              <Text style={{ ...typography.body, color: theme.text }}>
                {selectedLocaleMeta
                  ? `${selectedLocaleMeta.emoji} ${selectedLocaleMeta.nativeName}`
                  : language}
              </Text>
            </Pressable>
            <Text style={{ ...typography.caption, color: theme.textMuted }}>
              {t("feedback.languageHint")}
            </Text>
          </View>

          <View style={{ gap: spacing[2] }}>
            <Text style={{ ...typography.caption, color: theme.textMuted }}>
              {t("feedback.titleLabel")}
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              editable={!busy}
              maxLength={120}
              placeholder={t("feedback.titlePlaceholder")}
              placeholderTextColor={theme.textMuted}
              style={{
                ...fieldShell(),
                ...typography.body,
                color: theme.text,
                minHeight: 52,
              }}
            />
          </View>

          <View style={{ gap: spacing[2] }}>
            <Text style={{ ...typography.caption, color: theme.textMuted }}>
              {t("feedback.descriptionLabel")}
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              editable={!busy}
              maxLength={4000}
              multiline
              textAlignVertical="top"
              placeholder={t("feedback.descriptionPlaceholder")}
              placeholderTextColor={theme.textMuted}
              style={{
                ...fieldShell(),
                ...typography.body,
                color: theme.text,
                minHeight: 140,
              }}
            />
          </View>

          <View style={{ gap: spacing[2] }}>
            <Text style={{ ...typography.caption, color: theme.textMuted }}>
              {t("feedback.photoLabel")}
            </Text>
            {localImage ? (
              <View style={{ gap: spacing[2] }}>
                <Image
                  source={{ uri: localImage.uri }}
                  style={{
                    width: "100%",
                    height: 180,
                    borderRadius: radius.md,
                    backgroundColor: theme.section,
                  }}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => {
                    setLocalImage(null);
                    setUploadError(null);
                  }}
                  disabled={busy}
                >
                  <Text style={{ ...typography.caption, color: theme.danger }}>
                    {t("feedback.removePhoto")}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={onAttachPress}
                disabled={busy}
                style={{
                  ...fieldShell(),
                  alignItems: "center",
                  paddingVertical: spacing[5],
                }}
              >
                <Text style={{ ...typography.body, color: theme.primary }}>
                  {t("feedback.addPhoto")}
                </Text>
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                    marginTop: spacing[1],
                  }}
                >
                  {t("feedback.photoOptional")}
                </Text>
              </Pressable>
            )}
            {uploadError ? (
              <Text style={{ ...typography.caption, color: theme.danger }}>
                {uploadError}
              </Text>
            ) : null}
          </View>

          {formError ? (
            <Text style={{ ...typography.caption, color: theme.danger }}>
              {formError}
            </Text>
          ) : null}

          <Pressable
            onPress={() => void onSubmit()}
            disabled={!canSubmit}
            style={{
              ...primaryButtonStyle(theme),
              opacity: canSubmit ? 1 : 0.5,
              marginTop: spacing[2],
            }}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit, busy }}
          >
            {busy ? (
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
                {t("feedback.submit")}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={languageOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setLanguageOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
          onPress={() => setLanguageOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingBottom: insets.bottom + spacing[4],
              maxHeight: "70%",
            }}
          >
            <Text
              style={{
                ...typography.title,
                color: theme.text,
                padding: spacing[4],
              }}
            >
              {t("feedback.languageLabel")}
            </Text>
            <ScrollView>
              {SUPPORTED_LOCALES.map((locale) => {
                const selected = locale.id === language;
                return (
                  <Pressable
                    key={locale.id}
                    onPress={() => {
                      setLanguage(locale.id);
                      setLanguageOpen(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing[3],
                      paddingHorizontal: spacing[4],
                      paddingVertical: spacing[3],
                      backgroundColor: selected
                        ? theme.section
                        : "transparent",
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{locale.emoji}</Text>
                    <Text
                      style={{
                        ...typography.body,
                        color: theme.text,
                        flex: 1,
                      }}
                    >
                      {locale.nativeName}
                    </Text>
                    {selected ? (
                      <Text style={{ color: theme.primary, fontWeight: "700" }}>
                        ✓
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <AppResultScreen
        visible={photoSourceOpen}
        variant="info"
        image={brandAssets.createListMascot}
        title={t("feedback.addPhoto")}
        description={t("feedback.photoOptional")}
        primaryLabel={t("feedback.takePhoto")}
        onPrimary={() => onPickPhotoSource("camera")}
        secondaryLabel={t("feedback.chooseGallery")}
        onSecondary={() => onPickPhotoSource("library")}
        onBack={() => setPhotoSourceOpen(false)}
      />

      <FeedbackSheet
        visible={successOpen}
        image={brandAssets.createListMascot}
        title={t("feedback.thanksTitle")}
        body={t("feedback.thanksBody")}
        primaryLabel={t("common.return")}
        onPrimary={() => {
          setSuccessOpen(false);
          if (router.canGoBack()) router.back();
          else router.replace("/help");
        }}
      />
    </Screen>
  );
}
