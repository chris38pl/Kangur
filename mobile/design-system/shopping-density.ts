/** Soft shopping density + shared chrome for Design System v2. */

import { brand, colors, radius, shadows, spacing, typography } from "./tokens";

export const shoppingDensity = {
  rowMinHeight: 68,
  categoryRowMinHeight: 76,
  primaryCtaMinHeight: 56,
  fabSize: 60,
  historyRowMinHeight: 48,
  purchasedColor: brand.primary,
  unavailableColor: brand.unavailable,
  progressBarHeight: 6,
  searchSlotHeight: 48,
  collapseDurationMs: 220,
} as const;

type Theme = (typeof colors)["light"] | (typeof colors)["dark"];

export function cardStyle(theme: Theme) {
  return {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.xl,
    padding: spacing[5],
    ...shadows.soft,
  } as const;
}

export function primaryButtonStyle(theme: Theme) {
  return {
    backgroundColor: theme.primary,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minHeight: shoppingDensity.primaryCtaMinHeight,
    ...shadows.soft,
  };
}

export function secondaryButtonStyle(theme: Theme) {
  return {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minHeight: shoppingDensity.primaryCtaMinHeight,
  };
}

export function inputStyle(theme: Theme) {
  return {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    color: theme.text,
    fontSize: typography.body.fontSize,
    minHeight: 52,
  };
}
