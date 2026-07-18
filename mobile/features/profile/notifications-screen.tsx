import { useRouter } from "expo-router";
import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { IconBell } from "@/components/tab-bar/tab-icons";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import type { NotificationPreferences } from "@/features/notifications/schemas";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/features/notifications/useNotifications";

type PrefKey = keyof NotificationPreferences;

function NotificationRow({
  label,
  value,
  showDivider,
  onValueChange,
}: {
  label: string;
  value: boolean;
  showDivider?: boolean;
  onValueChange: (next: boolean) => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing[4],
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: theme.border,
      }}
    >
      <Text
        style={{
          ...typography.body,
          color: theme.text,
          flex: 1,
          fontWeight: "500",
          marginRight: spacing[3],
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={theme.surface}
        ios_backgroundColor={theme.border}
        accessibilityLabel={label}
      />
    </View>
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
    <View style={{ marginBottom: spacing[5] }}>
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

function MutedBellBadge() {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IconBell color="#94A3B8" size={28} />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 32,
          height: 2.5,
          borderRadius: 2,
          backgroundColor: "#E5484D",
          transform: [{ rotate: "-42deg" }],
        }}
      />
    </View>
  );
}

function SilentModeEmpty({
  onEnable,
  enabling,
}: {
  onEnable: () => void;
  enabling: boolean;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing[6],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View style={{ position: "relative", marginBottom: spacing[2] }}>
          <Image
            source={brandAssets.silentMode}
            style={{ width: 240, height: 240, resizeMode: "contain" }}
            accessibilityLabel=""
          />
          <View
            style={{
              position: "absolute",
              top: spacing[2],
              right: spacing[2],
            }}
          >
            <MutedBellBadge />
          </View>
        </View>

        <Text
          style={{
            ...typography.title,
            fontSize: 24,
            lineHeight: 32,
            color: theme.text,
            textAlign: "center",
            marginTop: spacing[2],
          }}
        >
          {t("profile.silentModeTitle")}
        </Text>
        <Text
          style={{
            ...typography.body,
            color: theme.textMuted,
            textAlign: "center",
            marginTop: spacing[2],
            paddingHorizontal: spacing[4],
          }}
        >
          {t("profile.silentModeBody")}
        </Text>
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingTop: spacing[4],
          paddingBottom: spacing[4] + insets.bottom,
          paddingHorizontal: spacing[6],
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={onEnable}
          disabled={enabling}
          hitSlop={8}
          accessibilityRole="button"
          style={{ paddingVertical: spacing[2] }}
        >
          {enabling ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Text
              style={{
                ...typography.label,
                color: theme.primary,
                textAlign: "center",
              }}
            >
              {t("profile.silentModeEnable")}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const prefsQuery = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const prefs = prefsQuery.data;
  const silentMode = prefs?.silentMode === true;

  const setPref = (key: PrefKey, value: boolean) => {
    updatePrefs.mutate({ [key]: value });
  };

  return (
    <Screen style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[3],
          borderBottomWidth: silentMode ? 0 : 1,
          borderBottomColor: theme.border,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[2],
        }}
      >
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/(tabs)/profile" as never);
          }}
          hitSlop={10}
          accessibilityRole="button"
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BackIcon size={20} />
        </Pressable>
        <Text
          style={{
            ...typography.headline,
            color: theme.text,
            flex: 1,
            textAlign: silentMode ? "center" : "left",
            marginRight: silentMode ? 40 : 0,
          }}
        >
          {t("profile.notificationsScreenTitle")}
        </Text>
      </View>

      {prefsQuery.isPending || !prefs ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : silentMode ? (
        <SilentModeEmpty
          enabling={updatePrefs.isPending}
          onEnable={() => setPref("silentMode", false)}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing[4],
            paddingTop: spacing[5],
            paddingBottom: spacing[6] + insets.bottom,
          }}
        >
          <SectionCard title={t("profile.silentModeSection")}>
            <NotificationRow
              label={t("profile.silentModeToggle")}
              value={prefs.silentMode}
              onValueChange={(v) => setPref("silentMode", v)}
            />
          </SectionCard>

          <SectionCard title={t("profile.notificationsCollaboration")}>
            <NotificationRow
              label={t("profile.notificationsWorkspaceInvites")}
              value={prefs.workspaceInvitations}
              showDivider
              onValueChange={(v) => setPref("workspaceInvitations", v)}
            />
            <NotificationRow
              label={t("profile.notificationsShoppingStarted")}
              value={prefs.shoppingStarted}
              showDivider
              onValueChange={(v) => setPref("shoppingStarted", v)}
            />
            <NotificationRow
              label={t("profile.notificationsShoppingFinished")}
              value={prefs.shoppingFinished}
              showDivider
              onValueChange={(v) => setPref("shoppingFinished", v)}
            />
            <NotificationRow
              label={t("profile.notificationsShoppingListCreated")}
              value={prefs.shoppingListCreated}
              showDivider
              onValueChange={(v) => setPref("shoppingListCreated", v)}
            />
            <NotificationRow
              label={t("profile.notificationsShoppingListDeleted")}
              value={prefs.shoppingListDeleted}
              onValueChange={(v) => setPref("shoppingListDeleted", v)}
            />
          </SectionCard>

          <SectionCard title={t("profile.notificationsUpdates")}>
            <NotificationRow
              label={t("profile.notificationsAppUpdates")}
              value={prefs.appUpdates}
              showDivider
              onValueChange={(v) => setPref("appUpdates", v)}
            />
            <NotificationRow
              label={t("profile.notificationsNewFeatures")}
              value={prefs.newFeatures}
              onValueChange={(v) => setPref("newFeatures", v)}
            />
          </SectionCard>

          <SectionCard title={t("profile.notificationsMarketing")}>
            <NotificationRow
              label={t("profile.notificationsOffersPromos")}
              value={prefs.offersPromos}
              onValueChange={(v) => setPref("offersPromos", v)}
            />
          </SectionCard>

          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              textAlign: "center",
            }}
          >
            {t("profile.notificationsSystemHint")}
          </Text>
        </ScrollView>
      )}
    </Screen>
  );
}
