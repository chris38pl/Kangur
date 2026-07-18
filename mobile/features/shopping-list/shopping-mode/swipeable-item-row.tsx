import { getShoppingCategoryIcon } from "@shared/shopping-categories";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef } from "react";
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
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/design-system/tokens";
import { getCategoryBadgeColors } from "@/features/shopping-item/category-badge-colors";
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
  const badge = getCategoryBadgeColors(item.category);

  const translateX = useSharedValue(0);
  const measuredHeight = useSharedValue(72);
  const collapseHeight = useSharedValue(-1); // -1 = auto layout
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const rowWidth = useSharedValue(320);

  const commitPurchase = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPurchase(item, index);
  }, [index, item, onPurchase]);

  const commitUnavailable = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUnavailable(item, index);
  }, [index, item, onUnavailable]);

  const commitPurchaseRef = useRef(commitPurchase);
  const commitUnavailableRef = useRef(commitUnavailable);

  useEffect(() => {
    commitPurchaseRef.current = commitPurchase;
    commitUnavailableRef.current = commitUnavailable;
  }, [commitPurchase, commitUnavailable]);

  const runPurchase = useCallback(() => {
    commitPurchaseRef.current();
  }, []);

  const runUnavailable = useCallback(() => {
    commitUnavailableRef.current();
  }, []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-16, 16])
        .failOffsetY([-12, 12])
        .onUpdate((e) => {
          "worklet";
          translateX.value = e.translationX;
          scale.value =
            Math.abs(e.translationX) > COMMIT_DISTANCE * 0.5 ? 0.98 : 1;
        })
        .onEnd((e) => {
          "worklet";
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

          if (commitRight || commitLeft) {
            const startH = Math.max(measuredHeight.value, 1);
            collapseHeight.value = startH;
            translateX.value = withTiming(commitRight ? w : -w, {
              duration: 160,
            });
            opacity.value = withTiming(0, { duration: 180 });
            collapseHeight.value = withTiming(0, { duration: COLLAPSE_MS });
            if (commitRight) runOnJS(runPurchase)();
            else runOnJS(runUnavailable)();
            return;
          }

          if (abs < 1) return;

          translateX.value = withSpring(0, { damping: 20, stiffness: 220 });
          scale.value = withSpring(1);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated gesture
    [runPurchase, runUnavailable],
  );

  const rowStyle = useAnimatedStyle(() => {
    "worklet";
    const rotation = interpolate(translateX.value, [-200, 200], [-4, 4]);
    const collapsing = collapseHeight.value >= 0;
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
        { rotateZ: `${rotation}deg` },
      ],
      opacity: opacity.value,
      height: collapsing ? collapseHeight.value : undefined,
      marginBottom:
        collapsing && collapseHeight.value < 1 ? 0 : spacing[3],
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
      onLayout={(e) => {
        rowWidth.value = e.nativeEvent.layout.width;
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          bgStyle,
          {
            borderRadius: radius.xl,
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: spacing[3],
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
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && collapseHeight.value < 0) {
              measuredHeight.value = h;
            }
          }}
          style={[
            rowStyle,
            {
              backgroundColor: theme.surface,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: theme.border,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
              justifyContent: "center",
              ...shadows.soft,
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[3],
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.lg,
                backgroundColor: badge.background,
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Text style={{ fontSize: 22 }}>
                {getShoppingCategoryIcon(item.category)}
              </Text>
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  ...typography.headline,
                  color: theme.text,
                  fontSize: 16,
                  lineHeight: 22,
                }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.note ? (
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {item.note}
                </Text>
              ) : null}
            </View>

            {item.amount ? (
              <Text
                style={{
                  ...typography.label,
                  color: theme.textMuted,
                  flexShrink: 0,
                  marginLeft: spacing[2],
                }}
                numberOfLines={1}
              >
                {item.amount}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
