import { type ReactNode, useEffect, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { motionEasing, resolveDuration } from "@/design-system/motion";

import { useReducedMotion } from "./useReducedMotion";

type Props = {
  /** True while skeleton should show. */
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  /**
   * `screen` — flex:1 absolute crossfade (full-screen surfaces).
   * `inline` — skeleton swap then content fade-in (ScrollView bodies).
   */
  variant?: "screen" | "inline";
  style?: StyleProp<ViewStyle>;
};

/**
 * System loading → content transition.
 * Screens describe *state* (`loading`), not animation technique.
 * Motion Budget: dominant animation on the surface while active.
 */
export function LoadingTransition({
  loading,
  skeleton,
  children,
  variant = "screen",
  style,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [showSkeleton, setShowSkeleton] = useState(loading);
  const progress = useSharedValue(loading ? 0 : 1);

  useEffect(() => {
    const duration = resolveDuration("screenContent", { reduceMotion });

    if (loading) {
      setShowSkeleton(true);
      progress.value =
        duration === 0
          ? 0
          : withTiming(0, { duration, easing: motionEasing.outCubic });
      return;
    }

    if (duration === 0) {
      progress.value = 1;
      setShowSkeleton(false);
      return;
    }

    // Inline: drop skeleton immediately, fade content in (one dominant beat).
    if (variant === "inline") {
      setShowSkeleton(false);
      progress.value = 0;
      progress.value = withTiming(1, {
        duration,
        easing: motionEasing.outCubic,
      });
      return;
    }

    progress.value = withTiming(1, {
      duration,
      easing: motionEasing.outCubic,
    });
    const t = setTimeout(() => setShowSkeleton(false), duration);
    return () => clearTimeout(t);
  }, [loading, progress, reduceMotion, variant]);

  const skeletonStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  if (variant === "inline") {
    if (loading || showSkeleton) {
      return <View style={style}>{skeleton}</View>;
    }
    return (
      <Animated.View style={[style, contentStyle]}>{children}</Animated.View>
    );
  }

  return (
    <View style={[styles.screenRoot, style]}>
      {showSkeleton ? (
        <Animated.View
          pointerEvents={loading ? "auto" : "none"}
          style={[styles.layer, skeletonStyle]}
        >
          {skeleton}
        </Animated.View>
      ) : null}
      <Animated.View
        pointerEvents={loading ? "none" : "auto"}
        style={[styles.layer, contentStyle]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  layer: {
    ...StyleSheet.absoluteFill,
  },
});
