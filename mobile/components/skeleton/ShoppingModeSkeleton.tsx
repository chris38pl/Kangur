import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { SkeletonBone } from "@/components/skeleton/SkeletonBone";
import { useColorScheme } from "@/components/useColorScheme";
import { shoppingDensity } from "@/design-system/shopping-density";
import { colors, radius, spacing } from "@/design-system/tokens";

function SummaryCardSkeleton() {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.border,
        padding: spacing[4],
        marginBottom: spacing[3],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[3],
        }}
      >
        <SkeletonBone width={68} height={68} borderRadius={radius.lg} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBone width="72%" height={18} borderRadius={6} />
          <SkeletonBone width="48%" height={12} borderRadius={6} />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[2],
              marginTop: 4,
            }}
          >
            <SkeletonBone width={28} height={28} borderRadius={radius.full} />
            <SkeletonBone width={28} height={28} borderRadius={radius.full} />
            <SkeletonBone width={28} height={28} borderRadius={radius.full} />
          </View>
        </View>
      </View>
      <SkeletonBone
        width="100%"
        height={shoppingDensity.progressBarHeight}
        borderRadius={radius.full}
        style={{ marginTop: spacing[4] }}
      />
      <SkeletonBone
        width="40%"
        height={12}
        borderRadius={6}
        style={{ marginTop: spacing[2] }}
      />
    </View>
  );
}

function CategoryCardSkeleton() {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        marginBottom: spacing[3],
        padding: spacing[4],
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        minHeight: shoppingDensity.categoryRowMinHeight,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <SkeletonBone width={44} height={44} borderRadius={radius.lg} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBone width="58%" height={16} borderRadius={6} />
        <SkeletonBone width="36%" height={12} borderRadius={6} />
        <SkeletonBone
          width="100%"
          height={shoppingDensity.progressBarHeight}
          borderRadius={radius.full}
        />
      </View>
      <SkeletonBone width={20} height={20} borderRadius={4} />
    </View>
  );
}

function ItemRowSkeleton() {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.border,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        marginBottom: spacing[3],
        minHeight: shoppingDensity.rowMinHeight,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
      }}
    >
      <SkeletonBone width={40} height={40} borderRadius={radius.lg} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBone width="62%" height={16} borderRadius={6} />
        <SkeletonBone width="38%" height={12} borderRadius={6} />
      </View>
    </View>
  );
}

/** Shopping Mode home: summary card + category rows. */
export function ShoppingModeSkeleton() {
  const { t } = useTranslation();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessibilityLabel={t("auth.loadingProfile")}
    >
      <SummaryCardSkeleton />

      <SkeletonBone
        width={140}
        height={18}
        borderRadius={6}
        style={{ marginBottom: spacing[3], marginTop: spacing[2] }}
      />
      <SkeletonBone
        width="88%"
        height={12}
        borderRadius={6}
        style={{ marginBottom: spacing[3] }}
      />

      <CategoryCardSkeleton />
      <CategoryCardSkeleton />
      <CategoryCardSkeleton />
      <CategoryCardSkeleton />
    </View>
  );
}

/** Category aisle: pending item rows while products load. */
export function ShoppingCategorySkeleton() {
  const { t } = useTranslation();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessibilityLabel={t("auth.loadingProfile")}
    >
      <SkeletonBone
        width={120}
        height={18}
        borderRadius={6}
        style={{ marginBottom: spacing[3] }}
      />
      <ItemRowSkeleton />
      <ItemRowSkeleton />
      <ItemRowSkeleton />
      <ItemRowSkeleton />
      <ItemRowSkeleton />
    </View>
  );
}
