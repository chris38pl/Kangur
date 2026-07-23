import { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { motionDuration } from "@/design-system/motion";

/**
 * Shared layout / list presets.
 * Prefer resolveDuration at call sites when reduced-motion aware wrappers exist;
 * these constants match tokens for Reanimated entering/exiting builders.
 */

export const layoutTransition = LinearTransition.duration(
  motionDuration.layout,
);

export const listItemEntering = FadeIn.duration(motionDuration.enter);

export const listItemExiting = FadeOut.duration(motionDuration.exit);
