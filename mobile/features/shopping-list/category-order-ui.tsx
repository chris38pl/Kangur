import { Platform, Pressable, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

type HandleProps = {
  onLongPress: () => void;
  disabled?: boolean;
};

/** Long enough that a scroll flick does not start a drag (esp. Android). */
const DRAG_LONG_PRESS_MS = Platform.OS === "android" ? 320 : 250;

/**
 * Drag handle for aisle reorder.
 * Native: RNGH TouchableOpacity (works with NestableScrollContainer).
 * Web: RN Pressable — RNGH TouchableOpacity + accessibilityRole="button"
 * nests <button> inside <button> on react-native-web (GestureHandlerButton
 * already sets role=button on the outer node).
 */
export function CategoryDragHandle({ onLongPress, disabled }: HandleProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const handleStyle = {
    width: 40,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    opacity: disabled ? 0.4 : 1,
  };

  const bars = (
    <View style={{ gap: 3.5 }} pointerEvents="none">
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 18,
            height: 2.5,
            borderRadius: 1,
            backgroundColor: theme.textMuted,
          }}
        />
      ))}
    </View>
  );

  if (Platform.OS === "web") {
    return (
      <Pressable
        onLongPress={onLongPress}
        disabled={disabled}
        delayLongPress={DRAG_LONG_PRESS_MS}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t("list.categoryOrderDragHandle")}
        style={handleStyle}
      >
        {bars}
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      disabled={disabled}
      delayLongPress={DRAG_LONG_PRESS_MS}
      activeOpacity={0.55}
      hitSlop={8}
      // Do NOT set accessibilityRole="button" — BaseButton/GestureHandlerButton
      // already applies it; duplicating nests <button> on web if this path runs.
      accessibilityLabel={t("list.categoryOrderDragHandle")}
      style={handleStyle}
    >
      {bars}
    </TouchableOpacity>
  );
}

/** ↑/↓ for web reorder (findNodeHandle / drag list unsupported). */
export function CategoryReorderWebControls({
  moveUp,
  moveDown,
}: {
  moveUp?: () => void;
  moveDown?: () => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  if (!moveUp && !moveDown) return null;

  return (
    <View style={{ gap: 2 }}>
      <Pressable
        onPress={moveUp}
        disabled={!moveUp}
        accessibilityRole="button"
        accessibilityLabel={t("list.categoryOrderMoveUp")}
        hitSlop={6}
        style={{
          width: 36,
          height: 22,
          alignItems: "center",
          justifyContent: "center",
          opacity: moveUp ? 1 : 0.25,
        }}
      >
        <Text style={{ ...typography.caption, color: theme.textMuted }}>↑</Text>
      </Pressable>
      <Pressable
        onPress={moveDown}
        disabled={!moveDown}
        accessibilityRole="button"
        accessibilityLabel={t("list.categoryOrderMoveDown")}
        hitSlop={6}
        style={{
          width: 36,
          height: 22,
          alignItems: "center",
          justifyContent: "center",
          opacity: moveDown ? 1 : 0.25,
        }}
      >
        <Text style={{ ...typography.caption, color: theme.textMuted }}>↓</Text>
      </Pressable>
    </View>
  );
}

export function CategoryOrderHint({ children }: { children: string }) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Text
      style={{
        ...typography.caption,
        color: theme.textMuted,
        marginBottom: spacing[3],
      }}
    >
      {children}
    </Text>
  );
}

type EditRowProps = {
  icon: string;
  label: string;
  onLongPress: () => void;
  isActive?: boolean;
  moveUp?: () => void;
  moveDown?: () => void;
};

/** Lighter aisle row for list edit reorder. */
export function CategoryOrderEditRow({
  icon,
  label,
  onLongPress,
  isActive,
  moveUp,
  moveDown,
}: EditRowProps) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  // Always use ↑/↓ on web — drag handle is native-only (and RNGH nests buttons on web).
  const webControls = Platform.OS === "web" || Boolean(moveUp || moveDown);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[3],
        marginBottom: spacing[2],
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: isActive ? theme.section : theme.surface,
      }}
    >
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text
        numberOfLines={1}
        style={{ ...typography.body, color: theme.text, flex: 1 }}
      >
        {label}
      </Text>
      {webControls ? (
        <CategoryReorderWebControls moveUp={moveUp} moveDown={moveDown} />
      ) : (
        <CategoryDragHandle onLongPress={onLongPress} />
      )}
    </View>
  );
}
