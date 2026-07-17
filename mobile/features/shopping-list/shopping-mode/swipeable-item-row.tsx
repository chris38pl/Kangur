import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useRef } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { shoppingDensity } from "@/design-system/shopping-density";
import { colors, spacing, typography } from "@/design-system/tokens";
import type { ShoppingItem } from "@/features/shopping-item/schemas";

type Props = {
  item: ShoppingItem;
  onPurchase: (item: ShoppingItem, index: number) => void;
  onUnavailable: (item: ShoppingItem, index: number) => void;
  index: number;
};

/** Short intentional swipe — absolute px, independent of row width. */
const COMMIT_DISTANCE = 56;
const COMMIT_DISTANCE_SLOW = 72;
const COMMIT_VELOCITY = 600;
const COLLAPSE_MS = shoppingDensity.collapseDurationMs;
const ROW_MIN = shoppingDensity.rowMinHeight;
const PURCHASED = shoppingDensity.purchasedColor;
const UNAVAILABLE = shoppingDensity.unavailableColor;

export function SwipeableItemRow({
  item,
  onPurchase,
  onUnavailable,
  index,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const translateX = useSharedValue(0);
  const rowHeight = useSharedValue<number>(ROW_MIN);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const rowWidth = useSharedValue(320);

  const itemRef = useRef(item);
  const indexRef = useRef(index);
  const onPurchaseRef = useRef(onPurchase);
  const onUnavailableRef = useRef(onUnavailable);
  itemRef.current = item;
  indexRef.current = index;
  onPurchaseRef.current = onPurchase;
  onUnavailableRef.current = onUnavailable;

  const commitPurchase = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPurchaseRef.current(itemRef.current, indexRef.current);
  }, []);

  const commitUnavailable = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUnavailableRef.current(itemRef.current, indexRef.current);
  }, []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        // Claim the gesture once movement is clearly horizontal (beats ScrollView).
        .activeOffsetX([-16, 16])
        .failOffsetY([-12, 12])
        .onUpdate((e) => {
          "worklet";
          translateX.value = e.translationX;
          scale.value = Math.abs(e.translationX) > COMMIT_DISTANCE * 0.5 ? 0.98 : 1;
        })
        .onEnd((e) => {
          "worklet";
          // Live shared value is more reliable than the event when a parent
          // scroll view interrupts the pan.
          const x = translateX.value;
          const v = e.velocityX;
          const abs = Math.abs(x);
          const w = Math.max(rowWidth.value, 1);

          const commitRight =
            x > COMMIT_DISTANCE_SLOW ||
            (x > COMMIT_DISTANCE && v >= 0) ||
            (x > 28 && v > COMMIT_VELOCITY);

          const commitLeft =
            x < -COMMIT_DISTANCE_SLOW ||
            (x < -COMMIT_DISTANCE && v <= 0) ||
            (x < -28 && v < -COMMIT_VELOCITY);

          if (commitRight) {
            translateX.value = withTiming(w, { duration: 160 });
            opacity.value = withTiming(0, { duration: 180 });
            rowHeight.value = withTiming(0, { duration: COLLAPSE_MS });
            runOnJS(commitPurchase)();
            return;
          }
          if (commitLeft) {
            translateX.value = withTiming(-w, { duration: 160 });
            opacity.value = withTiming(0, { duration: 180 });
            rowHeight.value = withTiming(0, { duration: COLLAPSE_MS });
            runOnJS(commitUnavailable)();
            return;
          }

          if (abs < 1) return;

          translateX.value = withSpring(0, { damping: 20, stiffness: 220 });
          scale.value = withSpring(1);
        }),
    // Shared values + ref-backed JS callbacks are stable for this row's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gesture once
    [],
  );

  const rowStyle = useAnimatedStyle(() => {
    "worklet";
    const rotation = interpolate(translateX.value, [-200, 200], [-4, 4]);
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
        { rotateZ: `${rotation}deg` },
      ],
      opacity: opacity.value,
      height: rowHeight.value,
      overflow: "hidden" as const,
    };
  });

  const bgStyle = useAnimatedStyle(() => {
    "worklet";
    const right = translateX.value > 0;
    const left = translateX.value < 0;
    return {
      backgroundColor: right ? PURCHASED : left ? UNAVAILABLE : "transparent",
      opacity: Math.min(1, Math.abs(translateX.value) / 48),
    };
  });

  return (
    <View
      style={{ marginBottom: spacing[2] }}
      onLayout={(e) => {
        rowWidth.value = e.nativeEvent.layout.width;
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          bgStyle,
          {
            borderRadius: 12,
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            justifyContent: "center",
            paddingHorizontal: spacing[4],
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            ✓ {t("shoppingMode.purchased")}
          </Text>
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            {t("shoppingMode.unavailable")}
          </Text>
        </View>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            rowStyle,
            {
              backgroundColor: theme.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              paddingHorizontal: spacing[4],
              justifyContent: "center",
              minHeight: ROW_MIN,
            },
          ]}
        >
          <Text
            style={{ ...typography.body, color: theme.text }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.amount || item.note ? (
            <Text
              style={{ ...typography.caption, color: theme.textMuted }}
              numberOfLines={1}
            >
              {[item.amount, item.note].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
