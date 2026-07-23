import { Pressable, Text, View } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

type Props = {
  /** Single-line label (legacy). Ignored when title+subtitle are set. */
  label?: string;
  /** First line — regular weight. */
  title?: string;
  /** Second line — semibold. */
  subtitle?: string;
  /** Compact trailing chip (e.g. remaining credits). Shown before the chevron. */
  badge?: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Soft Premium upsell row (chevron). Not a hero banner. */
export function PremiumHintRow({
  label,
  title,
  subtitle,
  badge,
  onPress,
  accessibilityLabel,
}: Props) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const twoLine = Boolean(title && subtitle);
  const a11y =
    accessibilityLabel ??
    (twoLine
      ? `${title}. ${subtitle}${badge ? `. ${badge}` : ""}`
      : `${label ?? ""}${badge ? `. ${badge}` : ""}`);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[4],
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[3],
        borderRadius: radius.lg,
        backgroundColor: "#FFF9F2",
        borderWidth: 1,
        borderColor: "#F0E0D0",
      }}
    >
      <Text style={{ fontSize: 26, lineHeight: 30 }}>👑</Text>
      {twoLine ? (
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            style={{
              ...typography.caption,
              color: theme.text,
              fontWeight: "400",
            }}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text
            style={{
              ...typography.caption,
              color: theme.text,
              fontWeight: "600",
            }}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        </View>
      ) : (
        <Text
          style={{
            ...typography.caption,
            color: theme.text,
            flex: 1,
            fontWeight: "600",
          }}
          numberOfLines={2}
        >
          {label}
        </Text>
      )}
      {badge ? (
        <View
          style={{
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1],
            borderRadius: radius.full,
            backgroundColor: "#FFF3E6",
            borderWidth: 1,
            borderColor: "#E8C9A8",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              lineHeight: 14,
              fontWeight: "700",
              color: "#C47A3A",
            }}
            numberOfLines={1}
          >
            {badge}
          </Text>
        </View>
      ) : null}
      <Text
        style={{
          fontSize: 20,
          lineHeight: 22,
          color: theme.textMuted,
          fontWeight: "300",
        }}
      >
        ›
      </Text>
    </Pressable>
  );
}
