import { SCREENS, type MarketingImage } from "@/lib/marketing/images.generated";
import { AISLE_LOOP } from "@/lib/marketing/loop.generated";
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

/** Recording of shopping mode, Polish only. */
export { AISLE_LOOP };
