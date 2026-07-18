import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { type ReactNode } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
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
import { useMe } from "@/features/auth/useMe";
import {
  ProfileIconBag,
  ProfileIconBell,
  ProfileIconCard,
  ProfileIconChevronRight,
  ProfileIconCrown,
  ProfileIconGlobe,
  ProfileIconHelp,
  ProfileIconHome,
  ProfileIconInfo,
  ProfileIconList,
  ProfileIconLogout,
  ProfileIconPalette,
  ProfileIconPeople,
  ProfileIconPerson,
  ProfileIconShield,
} from "@/features/profile/profile-icons";
import { useShoppingLists } from "@/features/shopping-list/useShoppingLists";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { useTabBarClearance } from "@/hooks/useSafeAreaLayout";
import i18n from "@/lib/i18n";

function displayNameFromEmail(email: string | undefined): string {
  if (!email) return "Kangur";
  const local = email.split("@")[0]?.trim();
  if (!local) return "Kangur";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function ProfileMenuRow({
  icon,
  title,
  value,
  showDivider,
  showChevron = true,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  value?: string;
  showDivider?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const content = (
    <View
      style={{
        width: "100%",
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing[4],
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: theme.border,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          marginRight: spacing[3],
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </View>

      <Text
        style={{
          ...typography.body,
          color: theme.text,
          flexGrow: 1,
          flexShrink: 1,
          fontWeight: "500",
          marginRight: spacing[2],
        }}
        numberOfLines={1}
      >
        {title}
      </Text>

      {value ? (
        <Text
          style={{
            ...typography.caption,
            color: theme.textMuted,
            marginRight: showChevron ? spacing[2] : 0,
            flexShrink: 0,
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}

      {showChevron ? (
        <View
          style={{
            width: 20,
            height: 20,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ProfileIconChevronRight color={theme.textMuted} size={16} />
        </View>
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.7 : 1 }}>{content}</View>
      )}
    </Pressable>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View style={{ marginTop: spacing[6] }}>
      <Text
        style={{
          ...typography.headline,
          color: theme.text,
          marginBottom: spacing[3],
        }}
      >
        {title}
      </Text>
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
    </View>
  );
}

function StatCell({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number;
  label: string;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View style={{ flex: 1, alignItems: "center", gap: spacing[1] }}>
      <View
        style={{
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 2,
        }}
      >
        {icon}
      </View>
      <Text style={{ ...typography.headline, color: theme.text, fontSize: 18 }}>
        {value}
      </Text>
      <Text
        style={{
          ...typography.caption,
          color: theme.textMuted,
          fontSize: 11,
          lineHeight: 14,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const tabClearance = useTabBarClearance();
  const router = useRouter();
  const { signOut, userId } = useAuth();
  const { data: me } = useMe();
  const queryClient = useQueryClient();

  const workspacesQuery = useWorkspaces();
  const { activeWorkspace, hydrated } = useActiveWorkspace(workspacesQuery.data);
  const listsQuery = useShoppingLists(activeWorkspace?.id ?? null, hydrated);

  const spacesCount = workspacesQuery.data?.length ?? 0;
  const lists = listsQuery.data ?? [];
  const listsCount = lists.length;
  const productsCount = lists.reduce((sum, list) => sum + list.itemCount, 0);
  const isPremium =
    workspacesQuery.data?.some((w) => w.plan === "premium") ?? false;

  const appVersion =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

  const languageLabel =
    i18n.language === "pl" ? t("profile.languagePl") : t("profile.languageEn");

  const showSoon = () => {
    Alert.alert(t("profile.comingSoon"));
  };

  const openAccount = () => {
    router.push("/account");
  };

  const openNotifications = () => {
    router.push("/notifications");
  };

  const toggleLanguage = () => {
    const next = i18n.language === "pl" ? "en" : "pl";
    void i18n.changeLanguage(next);
  };

  const onSignOut = async () => {
    console.info("[auth]", "SignOut", { clerkId: userId });
    await signOut();
    queryClient.removeQueries({ queryKey: ["me"] });
  };

  const goHome = () => {
    router.push("/(tabs)");
  };

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
            gap: spacing[2],
          }}
        >
          <Pressable
            onPress={goHome}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("auth.back")}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BackIcon size={20} />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ ...typography.headline, color: theme.text }}
            >
              {t("profile.title")}
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                marginTop: 2,
              }}
            >
              {t("profile.subtitle")}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[6],
          paddingTop: spacing[5],
          paddingBottom: tabClearance,
        }}
      >
        <Pressable
          onPress={openAccount}
          accessibilityRole="button"
          accessibilityLabel={t("profile.accountDetails")}
          style={{
            backgroundColor: theme.section,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: `${brand.primary}33`,
            paddingTop: spacing[4],
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[3],
              paddingHorizontal: spacing[4],
              paddingBottom: spacing[4],
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radius.full,
                backgroundColor: brand.accent,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <Image
                source={brandAssets.icon}
                style={{ width: 56, height: 56, resizeMode: "cover" }}
                accessibilityLabel=""
              />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{ ...typography.headline, color: theme.text }}
                numberOfLines={1}
              >
                {displayNameFromEmail(me?.email)}
              </Text>
              {me?.email ? (
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                    marginTop: 1,
                  }}
                  numberOfLines={1}
                >
                  {me.email}
                </Text>
              ) : null}
              {isPremium ? (
                <View
                  style={{
                    marginTop: spacing[2],
                    alignSelf: "flex-start",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "#EAF7F2",
                    borderRadius: radius.full,
                    paddingHorizontal: spacing[2] + 2,
                    paddingVertical: 3,
                  }}
                >
                  <ProfileIconCrown color={brand.unavailable} size={12} />
                  <Text
                    style={{
                      ...typography.caption,
                      fontWeight: "700",
                      color: theme.primary,
                      fontSize: 12,
                    }}
                  >
                    {t("profile.premium")}
                  </Text>
                </View>
              ) : null}
            </View>

            <ProfileIconChevronRight color={theme.textMuted} size={18} />
          </View>

          <View
            style={{
              flexDirection: "row",
              borderTopWidth: 1,
              borderTopColor: theme.border,
              paddingVertical: spacing[3],
              paddingHorizontal: spacing[2],
            }}
          >
            <StatCell
              icon={<ProfileIconHome color={theme.primary} size={28} />}
              value={spacesCount}
              label={t("profile.statSpaces")}
            />
            <View
              style={{
                width: 1,
                backgroundColor: theme.border,
                marginVertical: 4,
              }}
            />
            <StatCell
              icon={<ProfileIconList color={theme.primary} size={28} />}
              value={listsCount}
              label={t("profile.statLists")}
            />
            <View
              style={{
                width: 1,
                backgroundColor: theme.border,
                marginVertical: 4,
              }}
            />
            <StatCell
              icon={<ProfileIconBag color={theme.primary} size={28} />}
              value={productsCount}
              label={t("profile.statProducts")}
            />
          </View>
        </Pressable>

        <SectionCard title={t("profile.accountSection")}>
          <ProfileMenuRow
            icon={<ProfileIconPerson color={theme.primary} />}
            title={t("profile.accountDetails")}
            showDivider
            onPress={openAccount}
          />
          <ProfileMenuRow
            icon={<ProfileIconPeople color={theme.primary} />}
            title={t("profile.manageSpaces")}
            showDivider
            onPress={() => router.push("/(tabs)/workspace")}
          />
          <ProfileMenuRow
            icon={<ProfileIconCard color={theme.primary} />}
            title={t("profile.subscription")}
            showDivider
            onPress={showSoon}
          />
          <ProfileMenuRow
            icon={<ProfileIconBell color={theme.primary} />}
            title={t("profile.notifications")}
            showDivider
            onPress={openNotifications}
          />
          <ProfileMenuRow
            icon={<ProfileIconShield color={theme.primary} />}
            title={t("profile.privacy")}
            onPress={showSoon}
          />
        </SectionCard>

        <SectionCard title={t("profile.settingsSection")}>
          <ProfileMenuRow
            icon={<ProfileIconGlobe color={theme.primary} />}
            title={t("profile.appLanguage")}
            value={languageLabel}
            showDivider
            onPress={toggleLanguage}
          />
          <ProfileMenuRow
            icon={<ProfileIconPalette color={theme.primary} />}
            title={t("profile.appTheme")}
            value={t("profile.themeLight")}
            showDivider
            showChevron={false}
          />
          <ProfileMenuRow
            icon={<ProfileIconHelp color={theme.primary} />}
            title={t("profile.helpSupport")}
            showDivider
            onPress={showSoon}
          />
          <ProfileMenuRow
            icon={<ProfileIconInfo color={theme.primary} />}
            title={t("profile.aboutApp")}
            value={appVersion}
            onPress={showSoon}
          />
        </SectionCard>

        <Pressable
          onPress={() => void onSignOut()}
          accessibilityRole="button"
          accessibilityLabel={t("auth.signOut")}
          style={{
            marginTop: spacing[8],
            marginBottom: spacing[4],
            minHeight: 56,
            borderRadius: radius.full,
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing[2],
            paddingHorizontal: spacing[4],
          }}
        >
          <ProfileIconLogout color={theme.danger} size={18} />
          <Text style={{ ...typography.label, color: theme.danger }}>
            {t("auth.signOut")}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
