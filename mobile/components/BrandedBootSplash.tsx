import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { brandAssets } from "@/design-system/brand-assets";
import { brand } from "@/design-system/tokens";

const ENTER_DELAY_MS = 100;
const ENTER_DURATION_MS = 400;
const EXIT_DURATION_MS = 260;
const CIRCLE_EXPAND_MS = 900;

/** Splash mascot — larger than home hero for boot presence. */
const MASCOT_SIZE_PX = 320;
/** Circle sits tightly under the mascot. */
const CIRCLE_SIZE_RATIO = 0.8;

type Props = {
  /** When true, run exit (full overlay fade) then call onExitComplete. */
  exiting: boolean;
  onExitComplete: () => void;
};

/**
 * Cold-start brand splash: white canvas + mascot over an expanding mint circle.
 * Ignores SafeArea - optically centered on the physical screen.
 */
export function BrandedBootSplash({ exiting, onExitComplete }: Props) {
  const mascotSize = MASCOT_SIZE_PX;
  const circleSize = Math.round(mascotSize * CIRCLE_SIZE_RATIO);

  const overlayOpacity = useSharedValue(1);
  const mascotOpacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  const translateY = useSharedValue(20);
  const circleOpacity = useSharedValue(0);
  const circleScale = useSharedValue(0.28);

  useEffect(() => {
    const cubicOut = Easing.out(Easing.cubic);

    mascotOpacity.value = withDelay(
      ENTER_DELAY_MS,
      withTiming(1, { duration: ENTER_DURATION_MS, easing: cubicOut }),
    );
    scale.value = withDelay(
      ENTER_DELAY_MS,
      withSequence(
        withTiming(1, { duration: ENTER_DURATION_MS, easing: cubicOut }),
        withSpring(1.03, { damping: 14, stiffness: 220, mass: 0.7 }),
        withSpring(1, { damping: 16, stiffness: 200, mass: 0.7 }),
      ),
    );
    translateY.value = withDelay(
      ENTER_DELAY_MS,
      withSequence(
        withTiming(-2, { duration: ENTER_DURATION_MS, easing: cubicOut }),
        withTiming(0, { duration: 160, easing: cubicOut }),
      ),
    );

    // Soft mint disc grows under the mascot, then breathes while boot waits.
    circleOpacity.value = withDelay(
      ENTER_DELAY_MS,
      withTiming(1, { duration: ENTER_DURATION_MS, easing: cubicOut }),
    );
    circleScale.value = withDelay(
      ENTER_DELAY_MS,
      withSequence(
        withTiming(1, {
          duration: CIRCLE_EXPAND_MS,
          easing: Easing.out(Easing.cubic),
        }),
        withRepeat(
          withSequence(
            withTiming(1.03, {
              duration: 1100,
              easing: Easing.inOut(Easing.sin),
            }),
            withTiming(1, {
              duration: 1100,
              easing: Easing.inOut(Easing.sin),
            }),
          ),
          -1,
          false,
        ),
      ),
    );
  }, [circleOpacity, circleScale, mascotOpacity, scale, translateY]);

  useEffect(() => {
    if (!exiting) return;
    overlayOpacity.value = withTiming(
      0,
      { duration: EXIT_DURATION_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(onExitComplete)();
        }
      },
    );
  }, [exiting, onExitComplete, overlayOpacity]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const mascotStyle = useAnimatedStyle(() => ({
    opacity: mascotOpacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const circleStyle = useAnimatedStyle(() => ({
    opacity: circleOpacity.value * 0.85 * mascotOpacity.value,
    transform: [{ scale: circleScale.value }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, rootStyle]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.stage, { width: circleSize, height: circleSize }]}>
        <Animated.View
          style={[
            styles.circle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
            },
            circleStyle,
          ]}
        />
        <Animated.Image
          source={brandAssets.splashMascot}
          style={[
            styles.mascot,
            { width: mascotSize, height: mascotSize },
            mascotStyle,
          ]}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  stage: {
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    position: "absolute",
    backgroundColor: brand.accent,
  },
  mascot: {
    zIndex: 1,
  },
});
