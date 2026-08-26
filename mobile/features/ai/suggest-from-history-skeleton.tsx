import { View } from "react-native";

import { SkeletonBone } from "@/components/skeleton/SkeletonBone";
import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing } from "@/design-system/tokens";

const ROW_COUNT = 7;

function SuggestItemRowSkeleton() {
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
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBone width="62%" height={15} borderRadius={6} />
        <SkeletonBone width="78%" height={11} borderRadius={6} />
      </View>
      <SkeletonBone width={52} height={22} borderRadius={radius.full} />
      <SkeletonBone width={26} height={26} borderRadius={13} />
    </View>
  );
}

/** Static skeleton rows shown while history AI generates proposals. */
export function SuggestFromHistorySkeleton() {
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
      {Array.from({ length: ROW_COUNT }, (_, index) => (
        <SuggestItemRowSkeleton key={index} />
      ))}
    </View>
  );
}
