import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

type Props = {
  onPress: () => void;
  /** Hide entirely when there is nothing more to load. */
  visible: boolean;
  busy?: boolean;
  /** Override default `common.showMore`. */
  label?: string;
  /**
   * Optional remaining count for a11y / caption
   * (e.g. “Show more · 12 left”).
   */
  remainingCount?: number;
};

/**
 * Primary “Show more” control for paginated mobile lists.
 * Place directly under the last visible row (not sticky).
 */
export function ShowMoreButton({
  onPress,
  visible,
  busy = false,
  label,
  remainingCount,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  if (!visible) return null;

  const title = label ?? t("common.showMore");
  const a11y =
    remainingCount != null && remainingCount > 0
      ? t("common.showMoreA11y", { count: remainingCount })
      : title;

  return (
    <View style={{ marginTop: spacing[1], marginBottom: spacing[2] }}>
      <Pressable
        onPress={onPress}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        accessibilityState={{ busy }}
        style={({ pressed }) => ({
          minHeight: 48,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: pressed ? theme.section : theme.surface,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          opacity: busy ? 0.7 : 1,
        })}
      >
        {busy ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <Text
            style={{
              ...typography.label,
              color: theme.primary,
              fontWeight: "700",
            }}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
