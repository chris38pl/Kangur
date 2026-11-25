import { SCREENS, type MarketingImage } from "@/lib/marketing/images.generated";
import type { AppLocale } from "@/lib/marketing/locale";

export type LocalizedScreens = {
  import: MarketingImage;
  aisle: MarketingImage;
  meal: MarketingImage;
  space: MarketingImage;
  summary: MarketingImage;
  /** Missing where the app had a Cyrillic bug when the screens were taken. */
  history?: MarketingImage;
};

/** Real app screens in the reader's language. Belarusian borrows Russian ones. */
export function screensFor(locale: AppLocale): LocalizedScreens {
  return SCREENS[locale === "be" ? "ru" : locale];
}

/** Recording of shopping mode, Polish only. Made by .marketing/06-seo/obrazy/build-loop.mjs. */
export const AISLE_LOOP = {
  src: "/img/wideo/alejki.0eee3516.mp4",
  poster: "/img/wideo/alejki.69103842.webp",
  width: 540,
  height: 1090,
  seconds: 10,
} as const;
