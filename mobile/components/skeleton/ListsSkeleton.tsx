import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { SkeletonBone } from "@/components/skeleton/SkeletonBone";
import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing } from "@/design-system/tokens";

function HistoryCardSkeleton() {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        backgroundColor: theme.surface,
        borderRadius: radius.xl,
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: theme.border,
        overflow: "hidden",
      }}
    >
      <View style={{ width: 7, backgroundColor: theme.border }} />
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: spacing[3],
          padding: spacing[4],
        }}
      >
        <SkeletonBone width={48} height={48} borderRadius={radius.lg} />
        <View style={{ flex: 1, gap: 8, paddingRight: 28 }}>
          <SkeletonBone width="68%" height={16} borderRadius={6} />
          <SkeletonBone width="42%" height={12} borderRadius={6} />
          <View style={{ flexDirection: "row", gap: 6, marginTop: 2 }}>
            <SkeletonBone width={28} height={28} borderRadius={radius.full} />
            <SkeletonBone width={28} height={28} borderRadius={radius.full} />
            <SkeletonBone width={28} height={28} borderRadius={radius.full} />
            <SkeletonBone width={36} height={28} borderRadius={radius.full} />
          </View>
        </View>
        <SkeletonBone
          width={22}
          height={22}
          borderRadius={6}
          style={{ position: "absolute", top: spacing[4], right: spacing[4] }}
        />
      </View>
    </View>
  );
}

/** List cards shell for the Listy tab while lists/history load. */
export function ListsSkeleton() {
  const { t } = useTranslation();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessibilityLabel={t("auth.loadingProfile")}
    >
      <HistoryCardSkeleton />
      <HistoryCardSkeleton />
      <HistoryCardSkeleton />
      <HistoryCardSkeleton />
      <HistoryCardSkeleton />
    </View>
  );
}
