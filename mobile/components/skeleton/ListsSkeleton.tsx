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
        alignItems: "flex-start",
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
  );
}

function SectionSkeleton({ cardCount }: { cardCount: number }) {
  return (
    <View style={{ marginBottom: spacing[5] }}>
      <SkeletonBone
        width={120}
        height={16}
        borderRadius={6}
        style={{ marginBottom: spacing[3] }}
      />
      {Array.from({ length: cardCount }, (_, i) => (
        <HistoryCardSkeleton key={i} />
      ))}
    </View>
  );
}

type Props = {
  /** When true, show three titled sections (Wszystko). Otherwise a flat card list. */
  multiSection?: boolean;
};

/** List cards shell for the Listy tab while lists/history load. */
export function ListsSkeleton({ multiSection = false }: Props) {
  const { t } = useTranslation();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessibilityLabel={t("auth.loadingProfile")}
    >
      {multiSection ? (
        <>
          <SectionSkeleton cardCount={2} />
          <SectionSkeleton cardCount={2} />
          <SectionSkeleton cardCount={2} />
        </>
      ) : (
        <>
          <HistoryCardSkeleton />
          <HistoryCardSkeleton />
          <HistoryCardSkeleton />
          <HistoryCardSkeleton />
          <HistoryCardSkeleton />
        </>
      )}
    </View>
  );
}
