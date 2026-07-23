import { Easing } from "react-native-reanimated";

/**
 * Kangur Motion Design System — timing tokens (SSOT).
 * Animate state changes, not content. Motion is functional, never decoration.
 * @see Motion Design System plan — Motion Budget: one dominant animation per surface.
 */

export const motionDuration = {
  /** Press scale / opacity micro-feedback */
  press: 90,
  /** Generic fade */
  fade: 140,
  /** First-show block enter (empty states) */
  enter: 150,
  /** Block / toast dismiss */
  exit: 120,
  /** LoadingTransition skeleton ↔ content */
  screenContent: 150,
  /** Height expand/collapse, list insert/remove */
  layout: 200,
  /** Custom sheet (OS Modal may use its own) */
  sheet: 250,
  /** Rare meaningful state beats — not decoration */
  emphasis: 220,
} as const;

export type MotionDurationToken = keyof typeof motionDuration;

/** Soft cap for non-sheet / non-boot motion. */
export const MOTION_HARD_CAP_MS = 250;

/** Reduced-motion snappy cut when animations are not fully disabled. */
export const MOTION_REDUCED_SNAP_MS = 40;

export const motionEasing = {
  outCubic: Easing.out(Easing.cubic),
  inOutEase: Easing.inOut(Easing.ease),
} as const;

export const motionSpring = {
  /** FAB / light UI springs */
  soft: { damping: 16, stiffness: 200, mass: 0.7 },
  /** Swipe settle */
  settle: { damping: 20, stiffness: 220 },
  /** Reorder / denser */
  dense: { damping: 24, stiffness: 120, mass: 0.25 },
} as const;

export type ResolveDurationOptions = {
  /** From AccessibilityInfo / useReducedMotion */
  reduceMotion: boolean;
};

/**
 * Resolve a motion token to milliseconds.
 * Reduced motion → 0 (instant cut) for layout/enter spectacle;
 * press affordance may still use a tiny snap via callers.
 */
export function resolveDuration(
  token: MotionDurationToken,
  options: ResolveDurationOptions,
): number {
  if (options.reduceMotion) {
    if (token === "press") return MOTION_REDUCED_SNAP_MS;
    return 0;
  }
  return motionDuration[token];
}
