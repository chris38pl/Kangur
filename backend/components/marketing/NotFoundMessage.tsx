"use client";

import { useSyncExternalStore } from "react";

import {
  SITE_DEFAULT_LOCALE,
  isAppLocale,
  splitLocalePrefix,
  withLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import { notFoundMessages } from "@/lib/marketing/not-found-messages";

const never = () => () => {};

/** The language in the address, else the first one of ours the browser lists. */
function visitorLocale(): AppLocale {
  const { prefix } = splitLocalePrefix(window.location.pathname);
  if (prefix) return prefix;
  for (const tag of navigator.languages ?? []) {
    const primary = tag.toLowerCase().split("-")[0];
    if (isAppLocale(primary)) return primary;
  }
  return SITE_DEFAULT_LOCALE;
}

/** One 404 document answers every language, so the text follows the visitor in the browser. */
export function NotFoundMessage() {
  const locale = useSyncExternalStore(
    never,
    visitorLocale,
    () => SITE_DEFAULT_LOCALE,
  );
  const t = notFoundMessages[locale];

  return (
    <div lang={locale}>
      <h1>{t.title}</h1>
      <p>{t.body}</p>
      <a className="mkt-btn mkt-btn-primary" href={withLocale(locale, "/")}>
        {t.back}
      </a>
    </div>
  );
}
