import { Pressable, Text, View } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import { brand, colors, radius, shadows, spacing, typography } from "@/design-system/tokens";

type Props = {
  icon: string;
  title: string;
  subtitle: string;
  disabled?: boolean;
  soon?: boolean;
  soonLabel?: string;
  onPress: () => void;
};

export function CreateListOptionRow({
  icon,
  title,
  subtitle,
  disabled,
  soon,
  soonLabel,
  onPress,
}: Props) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[4],
        borderRadius: radius.xl,
        backgroundColor: theme.surface,
        borderWidth: soon ? 1.5 : 1,
        borderColor: soon ? brand.primaryLight : theme.border,
        borderStyle: soon ? "dashed" : "solid",
        minHeight: 72,
        marginBottom: spacing[3],
        opacity: disabled && !soon ? 0.6 : 1,
        ...(!soon ? shadows.soft : null),
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radius.full,
          backgroundColor: brand.accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ ...typography.headline, color: theme.text }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: theme.textMuted,
            marginTop: 2,
          }}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      </View>

      {soon ? (
        <View
          style={{
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1],
            borderRadius: radius.full,
            backgroundColor: brand.accent,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              lineHeight: 14,
              fontWeight: "700",
              letterSpacing: 0.6,
              color: brand.primaryHover,
              textTransform: "uppercase",
            }}
          >
            {soonLabel}
          </Text>
        </View>
      ) : (
        <Text
          style={{
            fontSize: 26,
            lineHeight: 28,
            color: theme.textMuted,
            fontWeight: "300",
          }}
        >
          ›
        </Text>
      )}
    </Pressable>
  );
}
