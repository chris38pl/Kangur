import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { SkeletonBone } from "@/components/skeleton/SkeletonBone";
import { useColorScheme } from "@/components/useColorScheme";
import { brand, colors, radius, spacing } from "@/design-system/tokens";

function ListRowSkeleton() {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        backgroundColor: theme.surface,
        borderRadius: radius.xl,
        padding: spacing[4],
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <SkeletonBone width={48} height={48} borderRadius={radius.lg} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBone width="62%" height={16} borderRadius={6} />
        <SkeletonBone width="40%" height={12} borderRadius={6} />
        <SkeletonBone width="48%" height={12} borderRadius={6} />
      </View>
    </View>
  );
}

function SectionTitleSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing[3],
      }}
    >
      <SkeletonBone width={128} height={18} borderRadius={6} />
      {withAction ? (
        <SkeletonBone width={72} height={14} borderRadius={6} />
      ) : null}
    </View>
  );
}

/**
 * Home-shaped loading shell shown while the user profile boots.
 * Mirrors Start: header icons → hero → quick actions → lists.
 */
export function HomeSkeleton({
  showTabBar = true,
}: {
  /** Fake tab bar silhouette - off when real Tabs bar is already mounted. */
  showTabBar?: boolean;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing[4],
          paddingTop: spacing[2],
        }}
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        accessibilityLabel={t("auth.loadingProfile")}
      >
        {/* Top bar - menu + notifications */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: spacing[4],
          }}
        >
          <SkeletonBone width={28} height={22} borderRadius={6} />
          <SkeletonBone width={24} height={24} borderRadius={radius.full} />
        </View>

        {/* Hero - title, subtitle, illustration plane */}
        <View style={{ alignItems: "center", marginBottom: spacing[6] }}>
          <SkeletonBone width="78%" height={28} borderRadius={8} />
          <View style={{ height: spacing[3] }} />
          <SkeletonBone width="88%" height={14} borderRadius={6} />
          <View style={{ height: spacing[2] }} />
          <SkeletonBone width="64%" height={14} borderRadius={6} />
          <View
            style={{
              marginTop: spacing[5],
              width: 220,
              height: 200,
              borderRadius: radius.xl,
              backgroundColor: brand.accent,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <SkeletonBone
              width={140}
              height={140}
              borderRadius={radius.lg}
              style={{ backgroundColor: `${brand.primary}22` }}
            />
          </View>
        </View>

        {/* Quick actions */}
        <View style={{ marginBottom: spacing[6] }}>
          <SectionTitleSkeleton />
          <View style={{ flexDirection: "row", gap: spacing[2] }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ flex: 1, alignItems: "center", gap: spacing[2] }}>
                <SkeletonBone
                  width={64}
                  height={64}
                  borderRadius={radius.full}
                  style={{ backgroundColor: brand.accent }}
                />
                <SkeletonBone width="70%" height={12} borderRadius={6} />
              </View>
            ))}
          </View>
        </View>

        {/* Active workspace banner */}
        <View style={{ marginBottom: spacing[6] }}>
          <SectionTitleSkeleton />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[3],
              backgroundColor: theme.section,
              borderRadius: radius.xl,
              padding: spacing[4],
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <SkeletonBone width={44} height={44} borderRadius={radius.full} />
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonBone width="55%" height={16} borderRadius={6} />
              <SkeletonBone width="35%" height={12} borderRadius={6} />
            </View>
            <SkeletonBone width={18} height={18} borderRadius={4} />
          </View>
        </View>

        {/* Recent lists */}
        <View style={{ marginBottom: spacing[4] }}>
          <SectionTitleSkeleton withAction />
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
        </View>
      </View>

      {/* Tab bar silhouette - app feels already “in” */}
      {showTabBar ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.border,
            backgroundColor: theme.surface,
            paddingBottom: Math.max(insets.bottom, spacing[2]),
            paddingTop: spacing[3],
            paddingHorizontal: spacing[3],
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                width: "18%",
                alignItems: "center",
                gap: 6,
                opacity: i === 0 ? 1 : 0.5,
                paddingBottom: spacing[1],
              }}
            >
              <SkeletonBone
                width={22}
                height={22}
                borderRadius={6}
                style={
                  i === 0 ? { backgroundColor: `${brand.primary}55` } : undefined
                }
              />
              <SkeletonBone width={28} height={7} borderRadius={4} />
            </View>
          ))}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: "50%",
              marginLeft: -28,
              top: -14,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: brand.primary,
              opacity: 0.35,
              borderWidth: 3,
              borderColor: theme.bg,
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}
