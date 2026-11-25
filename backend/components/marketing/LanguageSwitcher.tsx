"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import {
  LOCALE_META,
  MARKETING_LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  stripLocalePrefix,
  type AppLocale,
} from "@/lib/marketing/locale";
import { alternateHref, findRouteByPath } from "@/lib/marketing/routes";

type Props = {
  locale: AppLocale;
  label: string;
};

function rememberLocale(next: AppLocale) {
  document.cookie = `${MARKETING_LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/**
 * Links to the same page in every language. Full page loads on purpose: the proxy has to
 * see the cookie set by the click.
 */
export function LanguageLinks({
  locale,
  home = false,
}: {
  locale: AppLocale;
  /** In the footer the languages lead to their home pages. */
  home?: boolean;
}) {
  // `/faq` in the browser is prerendered as `/pl/faq`; without the prefix both are the
  // same route, so server and client render the same links.
  const path = stripLocalePrefix(usePathname() || "/");
  const routeId = findRouteByPath(path)?.id ?? null;

  return SUPPORTED_LOCALES.map((item) => {
    const selected = item.id === locale;
    return (
      <li key={item.id}>
        <a
          href={alternateHref(home ? "home" : routeId, item.id)}
          hrefLang={item.id}
          lang={item.id}
          aria-current={selected ? "true" : undefined}
          className={
            home
              ? undefined
              : selected
                ? "mkt-lang-option is-active"
                : "mkt-lang-option"
          }
          onClick={() => rememberLocale(item.id)}
        >
          {item.nativeName}
        </a>
      </li>
    );
  });
}

/**
 * Language names, no flags: a language is not a country. The links are in the server HTML
 * even while the menu is closed, so crawlers can follow them.
 */
export function LanguageSwitcher({ locale, label }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      className="mkt-lang"
      ref={rootRef}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="mkt-lang-btn"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${LOCALE_META[locale].nativeName} (${locale.toUpperCase()})`}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden>
          <path
            d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.4 2.4 3.6 5.4 3.6 9S14.4 18.6 12 21M12 3C9.6 5.4 8.4 8.4 8.4 12s1.2 6.6 3.6 9M3.5 9h17M3.5 15h17"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        <span aria-hidden>{locale.toUpperCase()}</span>
      </button>

      <ul
        id={listId}
        className="mkt-lang-menu"
        aria-label={label}
        hidden={!open}
      >
        <LanguageLinks locale={locale} />
      </ul>
    </div>
  );
}

/** The same links inside the phone menu. */
export function LanguageList({ locale, label }: Props) {
  return (
    <ul className="mkt-menu-languages" aria-label={label}>
      <LanguageLinks locale={locale} />
    </ul>
  );
}
