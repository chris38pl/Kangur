import { View } from "react-native";

import { SkeletonBone } from "@/components/skeleton/SkeletonBone";
import { spacing } from "@/design-system/tokens";

/** Notification inbox skeleton for LoadingTransition. */
export function NotificationsSkeleton() {
  return (
    <View style={{ gap: spacing[3], paddingTop: spacing[2] }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[3],
          }}
        >
          <SkeletonBone width={44} height={44} borderRadius={12} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBone width="70%" height={14} />
            <SkeletonBone width="45%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}
