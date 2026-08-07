import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import { resolveAppLocale } from "./locales";
import { readPreferredLocale } from "./preferred-locale-storage";
import { resources } from "./resources";

const deviceLang = Localization.getLocales()[0]?.languageCode;
const fallback = resolveAppLocale(deviceLang);

// eslint-disable-next-line import/no-named-as-default-member -- i18next default export API
void i18next.use(initReactI18next).init({
  resources,
  lng: fallback,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

// Override with last explicit user choice (welcome switcher / profile) when present.
void readPreferredLocale().then((stored) => {
  if (!stored) return;
  if (resolveAppLocale(i18next.language) === stored) return;
  void i18next.changeLanguage(stored);
});

export default i18next;
export {
  resolveAppLocale,
  intlLocaleTag,
  LOCALE_META,
  SUPPORTED_LOCALES,
  localeMeta,
  type AppLocale,
} from "./locales";
