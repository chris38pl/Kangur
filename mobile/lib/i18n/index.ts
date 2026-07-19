import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import { resolveAppLocale } from "./locales";
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

export default i18next;
export {
  resolveAppLocale,
  intlLocaleTag,
  LOCALE_META,
  SUPPORTED_LOCALES,
  localeMeta,
  type AppLocale,
} from "./locales";
