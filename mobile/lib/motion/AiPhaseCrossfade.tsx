import { type ReactNode, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { motionEasing, resolveDuration } from "@/design-system/motion";

import { useReducedMotion } from "./useReducedMotion";

type Props = {
  /** Discrete phase key. Forward changes animate; backward = instant. */
  phase: string;
  children: ReactNode;
  style?: object;
};

/**
 * Forward-only AI phase crossfade.
 * Uploading → Analyzing → Done animates; going backward does not.
 */
export function AiPhaseCrossfade({ phase, children, style }: Props) {
  const reduceMotion = useReducedMotion();
  const prevPhase = useRef(phase);
  const phaseOrder = useRef<string[]>([phase]);
  const opacity = useSharedValue(1);
  const [display, setDisplay] = useState(children);

  useEffect(() => {
    if (phase === prevPhase.current) {
      setDisplay(children);
      return;
    }

    const known = phaseOrder.current;
    const prevIdx = known.indexOf(prevPhase.current);
    let nextIdx = known.indexOf(phase);
    if (nextIdx === -1) {
      known.push(phase);
      nextIdx = known.length - 1;
    }

    const isForward = nextIdx >= prevIdx;
    prevPhase.current = phase;

    if (!isForward || reduceMotion) {
      opacity.value = 1;
      setDisplay(children);
      return;
    }

    const duration = resolveDuration("screenContent", { reduceMotion });
    opacity.value = withTiming(0, {
      duration: Math.floor(duration / 2),
      easing: motionEasing.outCubic,
    });

    const t = setTimeout(() => {
      setDisplay(children);
      opacity.value = withTiming(1, {
        duration: Math.ceil(duration / 2),
        easing: motionEasing.outCubic,
      });
    }, Math.floor(duration / 2));

    return () => clearTimeout(t);
  }, [phase, children, opacity, reduceMotion]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={style}>
      <Animated.View style={[styles.fill, animStyle]}>{display}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: "100%",
  },
});
