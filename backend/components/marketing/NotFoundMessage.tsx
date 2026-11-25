"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  DEFAULT_LOCALE,
  MARKETING_LOCALE_COOKIE,
  SITE_DEFAULT_LOCALE,
  isAppLocale,
  splitLocalePrefix,
  withLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import { notFoundMessages } from "@/lib/marketing/not-found-messages";

const never = () => () => {};

/** The same order as the proxy: the address, the visitor's choice, the browser. */
function visitorLocale(): AppLocale {
  const { prefix } = splitLocalePrefix(window.location.pathname);
  if (prefix) return prefix;

  const chosen = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${MARKETING_LOCALE_COOKIE}=`))
    ?.split("=")[1];
  if (isAppLocale(chosen)) return chosen;

  const languages = navigator.languages ?? [];
  for (const tag of languages) {
    const primary = tag.toLowerCase().split("-")[0];
    if (isAppLocale(primary)) return primary;
  }
  return languages.length > 0 ? DEFAULT_LOCALE : SITE_DEFAULT_LOCALE;
}

/** One 404 document answers every language, so the text follows the visitor in the browser. */
export function NotFoundMessage() {
  const locale = useSyncExternalStore(
    never,
    visitorLocale,
    () => SITE_DEFAULT_LOCALE,
  );
  const t = notFoundMessages[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = `${t.title} | Kangur`;
  }, [locale, t.title]);

  return (
    <div>
      <h1>{t.title}</h1>
      <p>{t.body}</p>
      <a className="mkt-btn mkt-btn-primary" href={withLocale(locale, "/")}>
        {t.back}
      </a>
    </div>
  );
}
