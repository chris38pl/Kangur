import type { AppLocale } from "@/lib/marketing/locale";
import { homeBe } from "@/lib/marketing/content/home-be";
import { homeCs } from "@/lib/marketing/content/home-cs";
import { homeDe } from "@/lib/marketing/content/home-de";
import { homeEn } from "@/lib/marketing/content/home-en";
import { homeEs } from "@/lib/marketing/content/home-es";
import { homeFr } from "@/lib/marketing/content/home-fr";
import { homeIt } from "@/lib/marketing/content/home-it";
import { homePl } from "@/lib/marketing/content/home-pl";
import { homeRu } from "@/lib/marketing/content/home-ru";
import type { HomeCopy } from "@/lib/marketing/content/home-types";
import { homeUk } from "@/lib/marketing/content/home-uk";
import { typesetCopy } from "@/lib/marketing/typography";

const HOME: Record<AppLocale, HomeCopy> = {
  pl: typesetCopy(homePl, "pl"),
  en: typesetCopy(homeEn, "en"),
  de: typesetCopy(homeDe, "de"),
  fr: typesetCopy(homeFr, "fr"),
  es: typesetCopy(homeEs, "es"),
  it: typesetCopy(homeIt, "it"),
  cs: typesetCopy(homeCs, "cs"),
  ru: typesetCopy(homeRu, "ru"),
  uk: typesetCopy(homeUk, "uk"),
  be: typesetCopy(homeBe, "be"),
};

export function homeCopy(locale: AppLocale): HomeCopy {
  return HOME[locale];
}
