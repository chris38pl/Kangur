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
 * Links to the same page in every language. They are in the server HTML even while the
 * menu is closed, so crawlers can follow them. Full page loads on purpose: the proxy has
 * to see the cookie set by the click.
 */
export function LanguageSwitcher({ locale, label }: Props) {
  // `/faq` in the browser is prerendered as `/pl/faq`; without the prefix both are the
  // same route, so server and client render the same links.
  const path = stripLocalePrefix(usePathname() || "/");
  const routeId = findRouteByPath(path)?.id ?? null;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = LOCALE_META[locale];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="mkt-lang" ref={rootRef}>
      <button
        type="button"
        className="mkt-lang-btn"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${current.nativeName} (${locale.toUpperCase()})`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mkt-lang-flag" aria-hidden>
          {current.emoji}
        </span>
        <span className="mkt-lang-code" aria-hidden>
          {locale.toUpperCase()}
        </span>
        <span className="mkt-lang-chevron" aria-hidden>
          ▾
        </span>
      </button>

      <ul
        id={listId}
        className="mkt-lang-menu"
        aria-label={label}
        hidden={!open}
      >
        {SUPPORTED_LOCALES.map((item) => {
          const selected = item.id === locale;
          return (
            <li key={item.id}>
              <a
                href={alternateHref(routeId, item.id)}
                hrefLang={item.id}
                lang={item.id}
                aria-current={selected ? "true" : undefined}
                className={
                  selected ? "mkt-lang-option is-active" : "mkt-lang-option"
                }
                onClick={() => rememberLocale(item.id)}
              >
                <span aria-hidden>{item.emoji}</span>
                <span className="mkt-lang-option-name">{item.nativeName}</span>
                <span className="mkt-lang-option-code" aria-hidden>
                  {item.id.toUpperCase()}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
