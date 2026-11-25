import { preload } from "react-dom";

import { JAKARTA, MANROPE } from "@/lib/marketing/fonts.generated";
import type { AppLocale } from "@/lib/marketing/locale";

type Subset = { file: string; range: string };

const face = (family: string, { file, range }: Subset) =>
  `@font-face{font-family:"${family}";font-style:normal;font-weight:400 800;font-display:swap;src:url(${file}) format("woff2");unicode-range:${range}}`;

/** Arial stretched to the same lines, so the text does not move when the font arrives. */
const fallback = (family: string, ascent: number, descent: number, size: number) =>
  `@font-face{font-family:"${family} Fallback";src:local("Arial");ascent-override:${ascent}%;descent-override:${descent}%;line-gap-override:0%;size-adjust:${size}%}`;

const CSS = [
  face("Plus Jakarta Sans", JAKARTA.latin),
  face("Plus Jakarta Sans", JAKARTA["latin-ext"]),
  fallback("Plus Jakarta Sans", 98.88, 21.15, 104.98),
  face("Manrope", MANROPE.cyrillic),
  face("Manrope", MANROPE.latin),
  fallback("Manrope", 103.31, 29.07, 103.19),
  `:root{--font-jakarta:"Plus Jakarta Sans","Plus Jakarta Sans Fallback"}`,
  // Plus Jakarta Sans has no Cyrillic. Manrope is its closest relative that does.
  `:root:lang(ru),:root:lang(uk),:root:lang(be){--font-jakarta:"Manrope","Manrope Fallback"}`,
].join("");

function firstFonts(locale: AppLocale): readonly Subset[] {
  switch (locale) {
    case "ru":
    case "uk":
    case "be":
      return [MANROPE.cyrillic, MANROPE.latin];
    case "pl":
    case "cs":
      return [JAKARTA.latin, JAKARTA["latin-ext"]];
    default:
      return [JAKARTA.latin];
  }
}

/** Every language preloads only the letters it is written with. */
export function SiteFonts({ locale }: { locale: AppLocale }) {
  for (const { file } of firstFonts(locale)) {
    preload(file, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }
  return (
    <style href="site-fonts" precedence="fonts">
      {CSS}
    </style>
  );
}
