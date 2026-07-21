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
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[3],
        marginBottom: spacing[2],
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.bg,
      }}
    >
      <SkeletonBone width={28} height={28} borderRadius={radius.md} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBone width="62%" height={15} borderRadius={6} />
        <SkeletonBone width="44%" height={11} borderRadius={6} />
      </View>
      <SkeletonBone width={36} height={12} borderRadius={4} />
      <SkeletonBone width={52} height={22} borderRadius={radius.full} />
    </View>
  );
}

/** Static skeleton rows shown while history AI generates proposals. */
export function SuggestFromHistorySkeleton() {
  return (
    <View>
      {Array.from({ length: ROW_COUNT }, (_, index) => (
        <SuggestItemRowSkeleton key={index} />
      ))}
    </View>
  );
}
