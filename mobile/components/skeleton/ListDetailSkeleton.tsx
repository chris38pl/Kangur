import { View } from "react-native";

import { SkeletonBone } from "@/components/skeleton/SkeletonBone";
import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing } from "@/design-system/tokens";

function OptionRowSkeleton() {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[4],
        borderRadius: radius.xl,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: spacing[3],
      }}
    >
      <SkeletonBone width={40} height={40} borderRadius={radius.lg} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBone width="55%" height={15} borderRadius={6} />
        <SkeletonBone width="78%" height={12} borderRadius={6} />
      </View>
    </View>
  );
}

function ItemRowSkeleton() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        paddingVertical: spacing[3],
      }}
    >
      <SkeletonBone width={28} height={28} borderRadius={radius.md} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBone width="58%" height={16} borderRadius={6} />
        <SkeletonBone width="36%" height={11} borderRadius={6} />
      </View>
      <SkeletonBone width={52} height={22} borderRadius={radius.full} />
    </View>
  );
}

/** Mirrors list detail body: AI quick-add, import rows, item list. */
export function ListDetailSkeleton() {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View accessibilityLabel="Loading list" accessibilityRole="progressbar">
      <SkeletonBone width="72%" height={28} borderRadius={8} />
      <SkeletonBone
        width="92%"
        height={14}
        borderRadius={6}
        style={{ marginTop: spacing[2] }}
      />
      <SkeletonBone
        width="64%"
        height={14}
        borderRadius={6}
        style={{ marginTop: spacing[1] }}
      />

      <SkeletonBone
        width="100%"
        height={96}
        borderRadius={radius.lg}
        style={{ marginTop: spacing[4] }}
      />
      <SkeletonBone
        width="100%"
        height={48}
        borderRadius={radius.lg}
        style={{ marginTop: spacing[4] }}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[3],
          marginVertical: spacing[5],
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
        <SkeletonBone width={72} height={10} borderRadius={4} />
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
      </View>

      <OptionRowSkeleton />
      <OptionRowSkeleton />

      <SkeletonBone
        width={140}
        height={20}
        borderRadius={6}
        style={{ marginTop: spacing[6], marginBottom: spacing[3] }}
      />

      <ItemRowSkeleton />
      <ItemRowSkeleton />
      <ItemRowSkeleton />
      <ItemRowSkeleton />
      <ItemRowSkeleton />
    </View>
  );
}

/** Title + item-count bones for the list detail header while loading. */
export function ListHeaderTitleSkeleton() {
  return (
    <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
      <SkeletonBone width="70%" height={22} borderRadius={6} />
      <SkeletonBone width="40%" height={12} borderRadius={6} />
    </View>
  );
}
