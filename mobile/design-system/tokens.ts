/** Design tokens — 8px base spacing, warm orange primary, light/dark ready. */

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: "700" as const },
  title: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const },
  headline: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "500" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
} as const;

export const colors = {
  light: {
    bg: "#F7F5F2",
    surface: "#FFFFFF",
    text: "#1A1A1A",
    textMuted: "#6B6B6B",
    primary: "#E87B2A",
    primaryPressed: "#C9651F",
    border: "#E5E0DA",
    success: "#2F9E44",
    warning: "#F59F00",
    danger: "#E03131",
  },
  dark: {
    bg: "#121212",
    surface: "#1E1E1E",
    text: "#F5F5F5",
    textMuted: "#A3A3A3",
    primary: "#F08A3A",
    primaryPressed: "#E87B2A",
    border: "#333333",
    success: "#51CF66",
    warning: "#FCC419",
    danger: "#FF6B6B",
  },
} as const;

export type ColorSchemeName = keyof typeof colors;
