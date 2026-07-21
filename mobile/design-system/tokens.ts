/**
 * Kangur Design System v2 - semantic tokens (SSOT).
 * Premium mint / Scandinavian / Linear aesthetic. Never pure black.
 */

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 20,
  sheet: 28,
  full: 999,
} as const;

export const shadows = {
  soft: {
    shadowColor: "#1B2C3B",
    shadowOpacity: 0.06,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  fab: {
    shadowColor: "#1B2C3B",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 42, fontWeight: "700" as const },
  title: { fontSize: 26, lineHeight: 34, fontWeight: "700" as const },
  headline: { fontSize: 18, lineHeight: 26, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 26, fontWeight: "400" as const },
  label: { fontSize: 15, lineHeight: 22, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
} as const;

/** Brand + semantic colors - light is the product default. */
export const brand = {
  primary: "#43BFA8",
  primaryHover: "#35A894",
  primaryLight: "#74D4C1",
  accent: "#DFF5EF",
  unavailable: "#F59E0B",
  /** Soft orange - preferred-for-AI star (active). */
  starActive: "#F0A04B",
  heroGradient: ["#5FD0BA", "#36B29E"] as const,
} as const;

export const colors = {
  light: {
    bg: "#FFFFFF",
    section: "#F7FBFA",
    surface: "#FFFFFF",
    text: "#1F2B45",
    textBody: "#4F5B6C",
    textMuted: "#8A95A5",
    primary: brand.primary,
    primaryPressed: brand.primaryHover,
    primaryLight: brand.primaryLight,
    accent: brand.accent,
    border: "#E8EFF0",
    success: brand.primary,
    warning: brand.unavailable,
    danger: "#E05A5A",
    onPrimary: "#FFFFFF",
  },
  /** Soft dark - still airy, not Material black. */
  dark: {
    bg: "#12181F",
    section: "#1A222B",
    surface: "#1E2731",
    text: "#F2F5F8",
    textBody: "#C2CAD4",
    textMuted: "#8A95A5",
    primary: brand.primaryLight,
    primaryPressed: brand.primary,
    primaryLight: brand.primary,
    accent: "#1E3A36",
    border: "#2A3540",
    success: brand.primaryLight,
    warning: "#FCC419",
    danger: "#FF7B7B",
    onPrimary: "#FFFFFF",
  },
} as const;

export type ColorSchemeName = keyof typeof colors;
export type ThemeColors = (typeof colors)[ColorSchemeName];
