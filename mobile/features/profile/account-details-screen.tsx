import { useUser } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import {
  brand,
  colors,
  radius,
  spacing,
  typography,
} from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import {
  EmailOnlyPasswordRow,
  LoginMethodsSection,
} from "@/features/profile/login-methods-section";
import {
  ProfileIconCamera,
  ProfileIconChevronRight,
} from "@/features/profile/profile-icons";

function InfoRow({
  label,
  value,
  trailing,
  showDivider,
  onPress,
}: {
  label: string;
  value: string;
  trailing?: ReactNode;
  showDivider?: boolean;
  onPress?: () => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const body = (
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
          {label}
        </Text>
        <Text
          style={{
            ...typography.body,
            color: theme.text,
            fontWeight: "600",
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      {trailing}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.7 : 1 }}>{body}</View>
      )}
    </Pressable>
  );
}

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

export function AccountDetailsScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const showSoon = () => Alert.alert(t("profile.comingSoon"));

  const displayName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    t("profile.nameUnset");

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "-";

  const isEmailOnlyAuth =
    Boolean(user?.passwordEnabled) &&
    !(
      user?.externalAccounts.some(
        (account) =>
          account.provider === "google" || account.provider === "apple",
      ) ?? false
    );

  const avatarSource = user?.imageUrl
    ? { uri: user.imageUrl }
    : brandAssets.icon;

  const onChangePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("profile.comingSoon"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0] || !user) return;

    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      await user.setProfileImage({ file: blob });
    } catch {
      Alert.alert(t("profile.comingSoon"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.section }}>
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
              else router.replace("/(tabs)/profile");
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
            {t("profile.accountScreenTitle")}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[6],
          paddingTop: spacing[6],
          paddingBottom: Math.max(insets.bottom, spacing[4]) + spacing[6],
        }}
      >
        <View style={{ alignItems: "center", marginBottom: spacing[6] }}>
          <View style={{ width: 112, height: 112 }}>
            <View
              style={{
                width: 112,
                height: 112,
                borderRadius: radius.full,
                backgroundColor: brand.accent,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isLoaded ? (
                <Image
                  source={avatarSource}
                  style={{ width: 112, height: 112, resizeMode: "cover" }}
                  accessibilityLabel=""
                />
              ) : (
                <ActivityIndicator color={theme.primary} />
              )}
            </View>

            <Pressable
              onPress={() => void onChangePhoto()}
              disabled={uploadingPhoto}
              accessibilityRole="button"
              accessibilityLabel={t("profile.changePhotoA11y")}
              style={{
                position: "absolute",
                right: 2,
                bottom: 2,
                width: 36,
                height: 36,
                borderRadius: radius.full,
                backgroundColor: theme.primary,
                borderWidth: 3,
                borderColor: theme.bg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {uploadingPhoto ? (
                <ActivityIndicator color={theme.onPrimary} size="small" />
              ) : (
                <ProfileIconCamera color={theme.onPrimary} size={16} />
              )}
            </Pressable>
          </View>
        </View>

        <Card>
          <InfoRow
            label={t("profile.fullName")}
            value={displayName}
            showDivider
            onPress={showSoon}
            trailing={
              <ProfileIconChevronRight color={theme.textMuted} size={16} />
            }
          />
          <InfoRow
            label={t("profile.emailLabel")}
            value={email}
            showDivider={isEmailOnlyAuth}
            onPress={showSoon}
            trailing={
              <ProfileIconChevronRight color={theme.textMuted} size={16} />
            }
          />
          <EmailOnlyPasswordRow />
        </Card>

        <LoginMethodsSection />
      </ScrollView>
    </Screen>
  );
}
