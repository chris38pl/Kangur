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
  pl: typesetCopy(homePl),
  en: homeEn,
  de: homeDe,
  fr: homeFr,
  es: homeEs,
  it: homeIt,
  cs: homeCs,
  ru: homeRu,
  uk: homeUk,
  be: homeBe,
};

export function homeCopy(locale: AppLocale): HomeCopy {
  return HOME[locale];
}
