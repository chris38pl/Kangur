import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { brandAssets } from "@/design-system/brand-assets";

const ENTER_DELAY_MS = 100;
const ENTER_DURATION_MS = 400;
const EXIT_DURATION_MS = 260;

const MASCOT_WIDTH_RATIO = 0.45;
const MASCOT_MIN_PX = 168;
const MASCOT_MAX_PX = 280;

type Props = {
  /** When true, run exit (full overlay fade) then call onExitComplete. */
  exiting: boolean;
  onExitComplete: () => void;
};

/**
 * Cold-start brand splash: white canvas + single mascot (lift → bounce → fade).
 * Ignores SafeArea - optically centered on the physical screen.
 */
export function BrandedBootSplash({ exiting, onExitComplete }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const mascotSize = Math.min(
    MASCOT_MAX_PX,
    Math.max(MASCOT_MIN_PX, Math.round(windowWidth * MASCOT_WIDTH_RATIO)),
  );
  const shadowWidth = Math.round(mascotSize * 0.62);
  const shadowHeight = Math.round(mascotSize * 0.12);

  const overlayOpacity = useSharedValue(1);
  const mascotOpacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  const translateY = useSharedValue(20);
  const shadowOpacity = useSharedValue(0.55);
  const shadowScale = useSharedValue(0.95);

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
    shadowOpacity.value = withDelay(
      ENTER_DELAY_MS,
      withSequence(
        withTiming(0.8, { duration: ENTER_DURATION_MS, easing: cubicOut }),
        withTiming(0.6, { duration: 200, easing: cubicOut }),
      ),
    );
    shadowScale.value = withDelay(
      ENTER_DELAY_MS,
      withSequence(
        withTiming(1.05, { duration: ENTER_DURATION_MS, easing: cubicOut }),
        withTiming(1, { duration: 200, easing: cubicOut }),
      ),
    );
  }, [mascotOpacity, scale, shadowOpacity, shadowScale, translateY]);

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

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: shadowOpacity.value * mascotOpacity.value,
    transform: [{ scaleX: shadowScale.value }, { scaleY: shadowScale.value }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, rootStyle]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.shadow,
            {
              width: shadowWidth,
              height: shadowHeight,
              borderRadius: shadowHeight / 2,
              marginBottom: -shadowHeight * 0.35,
            },
            shadowStyle,
          ]}
        />
        <Animated.Image
          source={brandAssets.splashMascot}
          style={[{ width: mascotSize, height: mascotSize }, mascotStyle]}
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
  shadow: {
    backgroundColor: "rgba(27, 44, 59, 0.22)",
  },
});
