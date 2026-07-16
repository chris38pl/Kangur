import { colors, type ColorSchemeName } from "./tokens";

export function getTheme(scheme: ColorSchemeName = "light") {
  return colors[scheme];
}
