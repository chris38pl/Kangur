import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "./en.json";
import pl from "./pl.json";

const deviceLang = Localization.getLocales()[0]?.languageCode;
const fallback = deviceLang === "pl" ? "pl" : "en";

// eslint-disable-next-line import/no-named-as-default-member -- i18next default export API
void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pl: { translation: pl },
  },
  lng: fallback,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export default i18next;
