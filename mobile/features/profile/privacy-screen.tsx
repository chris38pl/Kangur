import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { type ReactNode, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { FeedbackSheet } from "@/components/feedback-sheet";
import { Screen } from "@/components/Screen";
import { SkeletonBone } from "@/components/skeleton";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { clearLocalUserData } from "@/features/profile/clearLocalUserData";
import { DeleteAccountSheet } from "@/features/profile/delete-account-sheet";
import { deleteMeAccount } from "@/features/profile/api";
import {
  ProfileIconChevronRight,
  ProfileIconLogout,
} from "@/features/profile/profile-icons";
import {
  type ClerkSessionRow,
  useClerkSessions,
} from "@/features/profile/useClerkSessions";
import { formatRelativeUpdatedAt } from "@/lib/formatRelativeUpdatedAt";

function SectionCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
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
        {footer}
      </View>
    </View>
  );
}

function SessionDeviceIcon({
  isMobile,
  color,
}: {
  isMobile: boolean | null;
  color: string;
}) {
  const size = 22;
  if (isMobile === false) {
    // Browser / desktop outline
    return (
      <View
        style={{
          width: size,
          height: size * 0.75,
          borderWidth: 1.7,
          borderColor: color,
          borderRadius: 3,
        }}
      />
    );
  }
  // Phone outline
  return (
    <View
      style={{
        width: size * 0.55,
        height: size,
        borderWidth: 1.7,
        borderColor: color,
        borderRadius: 4,
      }}
    />
  );
}

function SessionsSkeleton() {
  return (
    <View style={{ padding: spacing[4], gap: spacing[4] }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{ flexDirection: "row", alignItems: "center", gap: spacing[3] }}
        >
          <SkeletonBone width={28} height={28} borderRadius={6} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBone width="55%" height={14} borderRadius={6} />
            <SkeletonBone width="70%" height={11} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

function sessionTitle(
  row: ClerkSessionRow,
  t: (key: string) => string,
): string {
  if (row.browserName?.trim()) return row.browserName.trim();
  if (row.deviceType?.trim()) return row.deviceType.trim();
  return t("privacy.sessions.unknownDevice");
}

function sessionLocation(
  row: ClerkSessionRow,
  t: (key: string) => string,
): string {
  const city = row.city?.trim();
  const country = row.country?.trim();
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  return t("privacy.sessions.unknownLocation");
}

export function PrivacyScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const { getToken, signOut } = useAuth();
  const queryClient = useQueryClient();
  const {
    sessions,
    isLoading,
    revokeOne,
    revokeOthers,
  } = useClerkSessions();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [revokeOneTarget, setRevokeOneTarget] =
    useState<ClerkSessionRow | null>(null);
  const [revokeOthersConfirmOpen, setRevokeOthersConfirmOpen] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState<
    | { kind: "empty" }
    | { kind: "done"; count: number }
    | { kind: "partial"; ok: number; total: number }
    | null
  >(null);

  const relativeLabels = {
    justNow: t("home.updatedJustNow"),
    minutes: (n: number) => t("home.updatedMinutes", { count: n }),
    hours: (n: number) => t("home.updatedHours", { count: n }),
    days: (n: number) => t("home.updatedDays", { count: n }),
  };

  const formatLastActive = (iso: string | null) => {
    if (!iso) return "-";
    return formatRelativeUpdatedAt(iso, relativeLabels) || "-";
  };

  const onRevokeOne = (row: ClerkSessionRow) => {
    setRevokeOneTarget(row);
  };

  const confirmRevokeOne = () => {
    if (!revokeOneTarget) return;
    const id = revokeOneTarget.id;
    setRevokeOneTarget(null);
    revokeOne.mutate(id, {
      onError: () => {
        Alert.alert(t("privacy.sessions.revokeFailed"));
      },
    });
  };

  const onRevokeOthers = () => {
    const others = sessions.filter((s) => !s.isCurrent);
    if (others.length === 0) {
      setSessionFeedback({ kind: "empty" });
      return;
    }
    setRevokeOthersConfirmOpen(true);
  };

  const confirmRevokeOthers = () => {
    setRevokeOthersConfirmOpen(false);
    revokeOthers.mutate(undefined, {
      onSuccess: ({ ok, total }) => {
        if (total === 0) return;
        if (ok === total) {
          setSessionFeedback({ kind: "done", count: ok });
        } else if (ok === 0) {
          Alert.alert(t("privacy.sessions.revokeOthersFailed"));
        } else {
          setSessionFeedback({ kind: "partial", ok, total });
        }
      },
      onError: () => {
        Alert.alert(t("privacy.sessions.revokeOthersFailed"));
      },
    });
  };

  const onDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert(t("privacy.delete.failed"));
        return;
      }

      await deleteMeAccount(token);

      try {
        await user.delete();
      } catch (clerkError) {
        console.info("[auth]", "DeleteAccountClerkFailed", clerkError);
        Alert.alert(t("privacy.delete.clerkFailed"));
        return;
      }

      await clearLocalUserData(queryClient);
      await signOut();
      setDeleteOpen(false);
      router.replace("/(auth)");
    } catch (error) {
      console.info("[auth]", "DeleteAccountFailed", error);
      Alert.alert(t("privacy.delete.failed"));
    } finally {
      setDeleting(false);
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
            {t("privacy.common.title")}
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
        <SectionCard
          title={t("privacy.sessions.title")}
          footer={
            !isLoading && sessions.some((s) => !s.isCurrent) ? (
              <Pressable
                onPress={onRevokeOthers}
                disabled={revokeOthers.isPending}
                accessibilityRole="button"
                style={{
                  paddingVertical: spacing[4],
                  alignItems: "center",
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                  opacity: revokeOthers.isPending ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: theme.primary,
                    fontWeight: "600",
                  }}
                >
                  {t("privacy.sessions.revokeOthers")}
                </Text>
              </Pressable>
            ) : null
          }
        >
          {isLoading ? (
            <SessionsSkeleton />
          ) : sessions.length === 0 ? (
            <View style={{ padding: spacing[4] }}>
              <Text style={{ ...typography.body, color: theme.textMuted }}>
                {t("privacy.sessions.empty")}
              </Text>
            </View>
          ) : (
            sessions.map((row, index) => {
              const title = sessionTitle(row, t);
              const subtitle = row.isCurrent
                ? t("privacy.sessions.thisDevice")
                : `${sessionLocation(row, t)} · ${formatLastActive(row.lastActiveAt)}`;
              const showDivider = index < sessions.length - 1;

              const body = (
                <View
                  style={{
                    minHeight: 64,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: spacing[4],
                    paddingVertical: spacing[3],
                    gap: spacing[3],
                    borderBottomWidth: showDivider ? 1 : 0,
                    borderBottomColor: theme.border,
                  }}
                >
                  <SessionDeviceIcon
                    isMobile={row.isMobile}
                    color={theme.textMuted}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        ...typography.body,
                        color: theme.text,
                        fontWeight: "600",
                      }}
                      numberOfLines={1}
                    >
                      {title}
                    </Text>
                    <Text
                      style={{
                        ...typography.caption,
                        color: theme.textMuted,
                        marginTop: 2,
                      }}
                      numberOfLines={2}
                    >
                      {subtitle}
                    </Text>
                  </View>
                  {row.isCurrent ? (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: theme.primary,
                      }}
                    />
                  ) : (
                    <ProfileIconChevronRight
                      color={theme.textMuted}
                      size={16}
                    />
                  )}
                </View>
              );

              if (row.isCurrent) return <View key={row.id}>{body}</View>;

              return (
                <Pressable
                  key={row.id}
                  onPress={() => onRevokeOne(row)}
                  accessibilityRole="button"
                  accessibilityLabel={t("privacy.sessions.revokeA11y", {
                    device: title,
                  })}
                >
                  {({ pressed }) => (
                    <View style={{ opacity: pressed ? 0.7 : 1 }}>{body}</View>
                  )}
                </Pressable>
              );
            })
          )}
        </SectionCard>

        <SectionCard title={t("privacy.delete.sectionTitle")}>
          <Pressable
            onPress={() => setDeleteOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t("privacy.delete.rowTitle")}
          >
            {({ pressed }) => (
              <View
                style={{
                  minHeight: 64,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                  gap: spacing[3],
                  opacity: pressed ? 0.7 : 1,
                }}
              >
                <ProfileIconLogout color={theme.danger} size={20} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      ...typography.body,
                      color: theme.danger,
                      fontWeight: "600",
                    }}
                  >
                    {t("privacy.delete.rowTitle")}
                  </Text>
                  <Text
                    style={{
                      ...typography.caption,
                      color: theme.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {t("privacy.delete.rowSubtitle")}
                  </Text>
                </View>
                <ProfileIconChevronRight color={theme.textMuted} size={16} />
              </View>
            )}
          </Pressable>
        </SectionCard>
      </ScrollView>

      <DeleteAccountSheet
        visible={deleteOpen}
        busy={deleting}
        onCancel={() => {
          if (!deleting) setDeleteOpen(false);
        }}
        onConfirm={() => void onDeleteAccount()}
      />

      <FeedbackSheet
        visible={revokeOneTarget != null}
        image={brandAssets.silentMode}
        title={t("privacy.sessions.revokeTitle")}
        body={
          revokeOneTarget
            ? t("privacy.sessions.revokeBody", {
                device: sessionTitle(revokeOneTarget, t),
              })
            : undefined
        }
        primaryLabel={t("privacy.sessions.revokeConfirm")}
        onPrimary={confirmRevokeOne}
        secondaryLabel={t("privacy.common.cancel")}
        onSecondary={() => setRevokeOneTarget(null)}
        primaryDestructive
        busy={revokeOne.isPending}
      />

      <FeedbackSheet
        visible={revokeOthersConfirmOpen}
        image={brandAssets.silentMode}
        title={t("privacy.sessions.revokeOthersTitle")}
        body={t("privacy.sessions.revokeOthersBody")}
        primaryLabel={t("privacy.sessions.revokeOthersConfirm")}
        onPrimary={confirmRevokeOthers}
        secondaryLabel={t("privacy.common.cancel")}
        onSecondary={() => setRevokeOthersConfirmOpen(false)}
        primaryDestructive
        busy={revokeOthers.isPending}
      />

      <FeedbackSheet
        visible={sessionFeedback != null}
        image={brandAssets.silentMode}
        title={
          sessionFeedback?.kind === "empty"
            ? t("privacy.sessions.revokeOthersTitle")
            : sessionFeedback?.kind === "done"
              ? t("privacy.sessions.revokeOthersDone", {
                  count: sessionFeedback.count,
                })
              : sessionFeedback?.kind === "partial"
                ? t("privacy.sessions.revokeOthersPartial", {
                    ok: sessionFeedback.ok,
                    total: sessionFeedback.total,
                  })
                : ""
        }
        body={
          sessionFeedback?.kind === "empty"
            ? t("privacy.sessions.revokeOthersEmpty")
            : undefined
        }
        primaryLabel={t("common.return")}
        onPrimary={() => setSessionFeedback(null)}
      />
    </Screen>
  );
}
