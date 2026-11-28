import { t } from "@/lib/i18n";
import { intlLocaleTag, type AppLocale } from "@/lib/locale";

import type { NameWords } from "./displayName";

/** The fallback word and the "since" date of labelPeople, in one language. */
export function nameWords(locale: AppLocale): NameWords {
  const day = new Intl.DateTimeFormat(intlLocaleTag(locale), {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Warsaw",
  });
  return {
    fallback: t(locale, "names.fallback"),
    since: (joinedAt) => t(locale, "names.since", { date: day.format(joinedAt) }),
  };
}
