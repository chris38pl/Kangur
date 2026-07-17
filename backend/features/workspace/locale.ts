export function settingsLanguageFromUserLocale(
  locale: string | null | undefined,
): "pl" | "en" {
  return locale === "pl" ? "pl" : "en";
}

export function defaultHomeName(language: "pl" | "en"): string {
  return language === "pl" ? "Dom" : "Home";
}
