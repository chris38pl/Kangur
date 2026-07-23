import { useAuth } from "@clerk/clerk-expo";
import { useRouter, type Href } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { FeedbackSheet } from "@/components/feedback-sheet";
import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { useMe } from "@/features/auth/useMe";
import {
  ProfileIconBell,
  ProfileIconCard,
  ProfileIconCrown,
  ProfileIconFeedback,
  ProfileIconHelp,
  ProfileIconInfo,
  ProfileIconPeople,
  ProfileIconPerson,
  ProfileIconShield,
} from "@/features/profile/profile-icons";
import { useTabBarClearance } from "@/hooks/useSafeAreaLayout";

import {
  visibleMenuSections,
  type AppMenuItem,
  type AppMenuItemId,
  type PlatformRole,
} from "./menu-config";

function MenuRow({
  icon,
  title,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  onPress: () => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {({ pressed }) => (
        <View
          style={{
            opacity: pressed ? 0.7 : 1,
            width: "100%",
            minHeight: 48,
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: spacing[2],
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
              flexShrink: 1,
              fontWeight: "500",
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function MenuSection({
  title,
  children,
  showSeparator,
}: {
  title: string;
  children: ReactNode;
  showSeparator?: boolean;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View>
      {showSeparator ? (
        <View
          style={{
            height: 1,
            backgroundColor: theme.border,
            marginVertical: spacing[4],
          }}
        />
      ) : null}
      <Text
        style={{
          ...typography.headline,
          color: theme.text,
          marginBottom: spacing[2],
        }}
      >
        {title}
      </Text>
      <View>{children}</View>
    </View>
  );
}

function itemIcon(id: AppMenuItemId, color: string) {
  switch (id) {
    case "account-details":
      return <ProfileIconPerson color={color} />;
    case "subscription":
      return <ProfileIconCard color={color} />;
    case "notifications":
      return <ProfileIconBell color={color} />;
    case "workspace":
      return <ProfileIconPeople color={color} />;
    case "help":
      return <ProfileIconHelp color={color} />;
    case "feedback":
      return <ProfileIconFeedback color={color} />;
    case "privacy":
      return <ProfileIconShield color={color} />;
    case "terms":
      return <ProfileIconShield color={color} />;
    case "about":
      return <ProfileIconInfo color={color} />;
    case "platform-console":
      return <ProfileIconCrown color={color} />;
    default:
      return <ProfileIconInfo color={color} />;
  }
}

export function MenuScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const tabClearance = useTabBarClearance();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { data: me } = useMe();
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const platformRole: PlatformRole = me?.platformRole ?? "USER";
  const sections = visibleMenuSections({
    platformRole,
    isSignedIn: Boolean(isSignedIn),
  });

  const navigate = (item: AppMenuItem) => {
    if (item.stub) {
      setComingSoonOpen(true);
      return;
    }
    if (item.href) {
      router.push(item.href as Href);
    }
  };

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.section }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[4],
          paddingTop: spacing[2],
          paddingBottom: tabClearance,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: spacing[5],
            gap: spacing[3],
          }}
        >
          <Image
            source={brandAssets.icon}
            style={{ width: 56, height: 56, borderRadius: radius.lg }}
            accessibilityIgnoresInvertColors
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                ...typography.headline,
                color: theme.text,
                fontWeight: "700",
              }}
              numberOfLines={1}
            >
              {t("home.title")}
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {t("home.subtitle")}
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("auth.back")}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BackIcon color={theme.text} size={22} />
          </Pressable>
        </View>

        {sections.map((section, sectionIndex) => (
          <MenuSection
            key={section.id}
            title={t(section.titleKey)}
            showSeparator={sectionIndex > 0}
          >
            {section.items.map((item) => (
              <MenuRow
                key={item.id}
                icon={itemIcon(item.id, theme.primary)}
                title={t(item.labelKey)}
                onPress={() => navigate(item)}
              />
            ))}
          </MenuSection>
        ))}
      </ScrollView>

      <FeedbackSheet
        visible={comingSoonOpen}
        image={brandAssets.createListMascot}
        title={t("profile.comingSoon")}
        body={t("profile.comingSoonBody")}
        primaryLabel={t("common.return")}
        onPrimary={() => setComingSoonOpen(false)}
      />
    </Screen>
  );
}
