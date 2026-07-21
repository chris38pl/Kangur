import { getShoppingCategoryIcon } from "@shared/shopping-categories";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { shoppingDensity } from "@/design-system/shopping-density";
import {
  brand,
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { useMe } from "@/features/auth/useMe";
import { OfflineStatusBanner } from "@/features/offline/OfflineStatusBanner";
import { DataSyncEngine } from "@/features/data-sync-engine";
import { finishShoppingSession } from "@/features/notifications/api";
import type { ShoppingItem } from "@/features/shopping-item/schemas";
import { intlLocaleTag } from "@/lib/i18n/locales";
import { useShoppingItems } from "@/features/shopping-item/useShoppingItems";
import { useShoppingSession } from "@/features/shopping-list/session/useShoppingSession";
import { useShoppingList } from "@/features/shopping-list/useShoppingLists";

type Props = {
  listId: string;
  /** Read-only summary for another member (from notification). */
  viewer?: boolean;
  /** Shopper display name when opened as viewer. */
  actorDisplayName?: string;
};

const BOUGHT_PREVIEW = 5;
const SUCCESS = "#2F8F84";
const DANGER = "#E05A5A";
const TIME = "#E6A817";
const UNAVAILABLE_BG = "#FDF2F2";
const UNAVAILABLE_BADGE_BG = "#FCE4E4";

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() || email;
  if (!local) return email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function formatDurationMinutes(ms: number, t: TFunction) {
  const totalMin = Math.max(1, Math.round(ms / 60_000));
  if (totalMin < 60) {
    return t("shoppingMode.durationMinutes", { count: totalMin });
  }
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (minutes === 0) {
    return t("shoppingMode.durationHours", { count: hours });
  }
  return t("shoppingMode.durationHoursMinutes", { hours, minutes });
}

function formatFinishedAt(
  date: Date,
  locale: string,
  t: TFunction,
) {
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const tag = intlLocaleTag(locale);
  const time = date.toLocaleTimeString(tag, {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (sameDay) {
    return t("shoppingMode.finishedToday", { time });
  }
  const day = date.toLocaleDateString(tag, {
    day: "numeric",
    month: "short",
  });
  return t("shoppingMode.finishedAt", { day, time });
}

function CircleGlyph({
  background,
  children,
  size = 28,
}: {
  background: string;
  children: ReactNode;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  );
}

function CheckMark({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <View
      style={{
        width: size * 0.7,
        height: size * 0.4,
        borderLeftWidth: 2,
        borderBottomWidth: 2,
        borderColor: color,
        transform: [{ rotate: "-45deg" }, { translateY: -1 }],
      }}
    />
  );
}

function CrossMark({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          position: "absolute",
          width: size,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}

function ClockGlyph({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1.5,
        borderColor: color,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 2,
      }}
    >
      <View style={{ width: 1.5, height: 4, backgroundColor: color, borderRadius: 1 }} />
      <View
        style={{
          position: "absolute",
          top: 5,
          left: 6,
          width: 4,
          height: 1.5,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

function ShareGlyph({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 14,
          height: 12,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 3,
          marginTop: 4,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 1,
          width: 1.8,
          height: 10,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 1,
          width: 8,
          height: 8,
          borderLeftWidth: 1.8,
          borderTopWidth: 1.8,
          borderColor: color,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}

function SummaryItemRow({
  item,
  variant,
}: {
  item: ShoppingItem;
  variant: "bought" | "unavailable";
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const unavailable = variant === "unavailable";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
      }}
    >
      <Text style={{ fontSize: 22 }}>{getShoppingCategoryIcon(item.category)}</Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ ...typography.headline, fontSize: 16, lineHeight: 22, color: theme.text }}
        >
          {item.name}
        </Text>
        {item.amount ? (
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              marginTop: 2,
            }}
          >
            {item.amount}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <CircleGlyph background={unavailable ? DANGER : SUCCESS} size={26}>
          {unavailable ? (
            <CrossMark color="#fff" size={9} />
          ) : (
            <CheckMark color="#fff" size={11} />
          )}
        </CircleGlyph>
        {unavailable ? (
          <Text style={{ ...typography.caption, fontSize: 11, color: theme.textMuted }}>
            {t("shoppingMode.unavailableLabel")}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function FinishSummaryScreen({
  listId,
  viewer = false,
  actorDisplayName,
}: Props) {
  const { t, i18n } = useTranslation();
  const { getToken } = useAuth();
  const me = useMe();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const listQuery = useShoppingList(listId);
  const itemsQuery = useShoppingItems(listId);
  const session = useShoppingSession(listId);
  const [showAllBought, setShowAllBought] = useState(false);

  const finishedAt = useMemo(() => new Date(), []);

  const actorName = useMemo(() => {
    if (actorDisplayName) return actorDisplayName;
    const email = me.data?.email;
    if (!email) return t("shoppingMode.you");
    return displayNameFromEmail(email);
  }, [actorDisplayName, me.data?.email, t]);

  const { boughtItems, unavailableItems, remaining } = useMemo(() => {
    const items = (itemsQuery.data ?? []).filter((i) => i.status !== "removed");
    return {
      boughtItems: items.filter((i) => i.status === "bought"),
      unavailableItems: items.filter((i) => i.status === "unavailable"),
      remaining: items.filter((i) => i.status === "pending").length,
    };
  }, [itemsQuery.data]);

  const sessionSnapshot = session.snapshot;
  const durationLabel = useMemo(() => {
    if (viewer && !sessionSnapshot?.startedAt) {
      return "-";
    }
    const started = sessionSnapshot?.startedAt
      ? new Date(sessionSnapshot.startedAt)
      : finishedAt;
    return formatDurationMinutes(finishedAt.getTime() - started.getTime(), t);
  }, [viewer, sessionSnapshot, finishedAt, t]);

  const visibleBought = showAllBought
    ? boughtItems
    : boughtItems.slice(0, BOUGHT_PREVIEW);

  const finish = useMutation({
    mutationFn: async () => {
      const serverSessionId = session.snapshot?.serverSessionId;
      let archivedOnServer = false;
      if (serverSessionId) {
        try {
          const token = await getToken();
          if (token) {
            await finishShoppingSession(
              token,
              listId,
              serverSessionId,
              unavailableItems.length,
            );
            archivedOnServer = true;
          }
        } catch (error) {
          console.info("[shopping]", "ServerSessionFinishFailed", error);
        }
      }
      await session.finish({ skipArchive: archivedOnServer });
    },
    onSuccess: async () => {
      const workspaceId = listQuery.data?.workspaceId;
      if (workspaceId) {
        queryClient.setQueryData(
          ["shopping-lists", workspaceId],
          (prev: { id: string }[] | undefined) =>
            prev?.filter((l) => l.id !== listId) ?? prev,
        );
      }
      await queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
      await session.clearEnded();
      router.replace("/(tabs)");
    },
  });

  const onShare = async () => {
    const listName = listQuery.data?.name ?? t("notifications.shoppingFinishedListFallback");
    try {
      await Share.share({
        message: t("shoppingMode.shareMessage", {
          list: listName,
          bought: boughtItems.length,
          unavailable: unavailableItems.length,
          duration: durationLabel,
        }),
      });
    } catch {
      // user dismissed
    }
  };

  const goHome = () => {
    router.replace("/(tabs)");
  };

  if (
    listQuery.isPending ||
    itemsQuery.isPending ||
    (!viewer && !session.hydrated)
  ) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.section,
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <Screen style={{ backgroundColor: theme.section }}>
      <OfflineStatusBanner listId={listId} overlay />

      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[3],
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.bg,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Pressable
          onPress={() => (viewer ? goHome() : router.back())}
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

        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: spacing[2] }}>
          <Text style={{ ...typography.headline, color: theme.text }} numberOfLines={1}>
            {t("shoppingMode.finishTitle")}
          </Text>
          <Text
            style={{ ...typography.caption, color: theme.textMuted, marginTop: 2 }}
            numberOfLines={1}
          >
            {formatFinishedAt(finishedAt, i18n.language, t)}
          </Text>
        </View>

        <Pressable
          onPress={() => void onShare()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("shoppingMode.shareA11y")}
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShareGlyph color={theme.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[4],
          paddingTop: spacing[4],
          paddingBottom: spacing[6] + insets.bottom + 120,
        }}
      >
        {!viewer && !DataSyncEngine.isOnline() ? (
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              marginBottom: spacing[3],
            }}
          >
            {t("offline.finishAnywayHint")}
          </Text>
        ) : null}

        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: theme.border,
            padding: spacing[4],
            ...shadows.soft,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[3] }}>
            <Image
              source={brandAssets.shoppingFinished}
              style={{ width: 88, height: 88, resizeMode: "contain" }}
              accessibilityLabel=""
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  ...typography.headline,
                  fontSize: 20,
                  lineHeight: 26,
                  color: theme.text,
                }}
              >
                {t("shoppingMode.finishedHeadline")}
              </Text>
              <Text
                style={{
                  ...typography.body,
                  color: theme.textBody,
                  marginTop: spacing[1],
                }}
              >
                {t("shoppingMode.finishedBy", { name: actorName })}
              </Text>
              {listQuery.data?.name ? (
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {listQuery.data.name}
                </Text>
              ) : null}
            </View>
          </View>

          <View
            style={{
              marginTop: spacing[4],
              paddingTop: spacing[4],
              borderTopWidth: 1,
              borderTopColor: theme.border,
              flexDirection: "row",
            }}
          >
            {[
              {
                key: "bought",
                value: String(boughtItems.length),
                label: t("shoppingMode.purchased"),
                iconBg: brand.accent,
                icon: <CheckMark color={SUCCESS} size={12} />,
              },
              {
                key: "unavailable",
                value: String(unavailableItems.length),
                label: t("shoppingMode.unavailable"),
                iconBg: UNAVAILABLE_BADGE_BG,
                icon: <CrossMark color={DANGER} size={10} />,
              },
              {
                key: "time",
                value: durationLabel,
                label: t("shoppingMode.shoppingTime"),
                iconBg: "#FFF6E0",
                icon: <ClockGlyph color={TIME} />,
              },
            ].map((stat, index) => (
              <View
                key={stat.key}
                style={{
                  flex: 1,
                  alignItems: "center",
                  borderLeftWidth: index === 0 ? 0 : 1,
                  borderLeftColor: theme.border,
                  paddingHorizontal: spacing[1],
                }}
              >
                <CircleGlyph background={stat.iconBg} size={32}>
                  {stat.icon}
                </CircleGlyph>
                <Text
                  style={{
                    ...typography.headline,
                    color: theme.text,
                    marginTop: spacing[2],
                    fontSize: 18,
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                    textAlign: "center",
                    marginTop: 2,
                  }}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {remaining > 0 ? (
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              marginTop: spacing[3],
              textAlign: "center",
            }}
          >
            {t("shoppingMode.summaryRemaining", { count: remaining })}
          </Text>
        ) : null}

        <View style={{ marginTop: spacing[6] }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[2],
              marginBottom: spacing[3],
            }}
          >
            <CircleGlyph background={SUCCESS} size={24}>
              <CheckMark color="#fff" size={10} />
            </CircleGlyph>
            <Text style={{ ...typography.headline, color: theme.text, flex: 1 }}>
              {t("shoppingMode.boughtSection")}
            </Text>
            <View
              style={{
                backgroundColor: theme.section,
                borderRadius: radius.full,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[1],
              }}
            >
              <Text style={{ ...typography.caption, color: theme.textBody, fontWeight: "600" }}>
                {t("notifications.productCount", { count: boughtItems.length })}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: theme.border,
              overflow: "hidden",
            }}
          >
            {boughtItems.length === 0 ? (
              <Text
                style={{
                  ...typography.body,
                  color: theme.textMuted,
                  padding: spacing[4],
                  textAlign: "center",
                }}
              >
                {t("shoppingMode.boughtEmpty")}
              </Text>
            ) : (
              visibleBought.map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? (
                    <View style={{ height: 1, backgroundColor: theme.border, marginLeft: 56 }} />
                  ) : null}
                  <SummaryItemRow item={item} variant="bought" />
                </View>
              ))
            )}
          </View>

          {boughtItems.length > BOUGHT_PREVIEW ? (
            <Pressable
              onPress={() => setShowAllBought((v) => !v)}
              style={{ marginTop: spacing[3], alignItems: "center", paddingVertical: spacing[2] }}
            >
              <Text style={{ ...typography.label, color: theme.primary }}>
                {showAllBought
                  ? t("shoppingMode.hideBought")
                  : t("shoppingMode.showAllBought", { count: boughtItems.length })}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {unavailableItems.length > 0 ? (
          <View style={{ marginTop: spacing[6] }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing[2],
                marginBottom: spacing[3],
              }}
            >
              <CircleGlyph background={DANGER} size={24}>
                <CrossMark color="#fff" size={9} />
              </CircleGlyph>
              <Text style={{ ...typography.headline, color: theme.text, flex: 1 }}>
                {t("shoppingMode.unavailableSection")}
              </Text>
              <View
                style={{
                  backgroundColor: UNAVAILABLE_BADGE_BG,
                  borderRadius: radius.full,
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[1],
                }}
              >
                <Text
                  style={{
                    ...typography.caption,
                    color: DANGER,
                    fontWeight: "600",
                  }}
                >
                  {t("notifications.productCount", { count: unavailableItems.length })}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: UNAVAILABLE_BG,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: UNAVAILABLE_BADGE_BG,
                overflow: "hidden",
              }}
            >
              {unavailableItems.map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: UNAVAILABLE_BADGE_BG,
                        marginLeft: 56,
                      }}
                    />
                  ) : null}
                  <SummaryItemRow item={item} variant="unavailable" />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing[4],
          paddingTop: spacing[3],
          paddingBottom: spacing[4] + insets.bottom,
          backgroundColor: theme.bg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}
      >
        {viewer ? (
          <Pressable
            onPress={goHome}
            style={{
              backgroundColor: theme.primary,
              borderRadius: radius.full,
              paddingVertical: spacing[4],
              alignItems: "center",
              minHeight: shoppingDensity.primaryCtaMinHeight,
              justifyContent: "center",
            }}
          >
            <Text style={{ ...typography.label, color: theme.onPrimary }}>
              {t("shoppingMode.summaryDone")}
            </Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={() => void finish.mutateAsync()}
              disabled={finish.isPending}
              style={{
                backgroundColor: theme.primary,
                borderRadius: radius.full,
                paddingVertical: spacing[4],
                alignItems: "center",
                minHeight: shoppingDensity.primaryCtaMinHeight,
                justifyContent: "center",
                opacity: finish.isPending ? 0.7 : 1,
              }}
            >
              {finish.isPending ? (
                <ActivityIndicator color={theme.onPrimary} />
              ) : (
                <Text style={{ ...typography.label, color: theme.onPrimary }}>
                  {DataSyncEngine.isOnline()
                    ? t("shoppingMode.summaryDone")
                    : t("offline.finishAnyway")}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={{
                marginTop: spacing[3],
                alignItems: "center",
                paddingVertical: spacing[2],
              }}
            >
              <Text style={{ ...typography.label, color: theme.primary }}>
                {t("shoppingMode.keepShopping")}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </Screen>
  );
}
