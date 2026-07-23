import { View } from "react-native";

import { Screen } from "@/components/Screen";
import { SkeletonBlock, SkeletonBone } from "@/components/skeleton/SkeletonBone";
import { useColorScheme } from "@/components/useColorScheme";
import { colors, spacing } from "@/design-system/tokens";

/** Lightweight workspace hub skeleton for LoadingTransition. */
export function WorkspaceSkeleton() {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
      <View style={{ padding: spacing[6], gap: spacing[4] }}>
        <SkeletonBone width={160} height={22} />
        <SkeletonBlock
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: theme.border,
            padding: spacing[5],
            gap: spacing[3],
          }}
        >
          <SkeletonBone width="55%" height={18} />
          <SkeletonBone width="40%" height={14} />
          <SkeletonBone width="100%" height={48} borderRadius={14} />
        </SkeletonBlock>
        <SkeletonBone width="100%" height={72} borderRadius={18} />
        <SkeletonBone width="100%" height={72} borderRadius={18} />
      </View>
    </Screen>
  );
}
