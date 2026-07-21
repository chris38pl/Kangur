"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import {
  LOCALE_META,
  MARKETING_LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  isAppLocale,
  stripLocalePrefix,
  type AppLocale,
  withLocale,
} from "@/lib/marketing/locale";

type Props = {
  locale: AppLocale;
  label: string;
};

function writeMarketingLocaleCookie(next: AppLocale) {
  document.cookie = `${MARKETING_LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LanguageSwitcher({ locale, label }: Props) {
  const router = useRouter();
  const pathname = usePathname() || "/";
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

  const switchTo = (next: AppLocale) => {
    setOpen(false);
    if (next === locale) return;
    writeMarketingLocaleCookie(next);
    const rest = stripLocalePrefix(pathname);
    router.push(withLocale(next, rest));
  };

  return (
    <div className="mkt-lang" ref={rootRef}>
      <button
        type="button"
        className="mkt-lang-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mkt-lang-flag" aria-hidden>
          {current.emoji}
        </span>
        <span className="mkt-lang-code">{locale.toUpperCase()}</span>
        <span className="mkt-lang-chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <ul
          id={listId}
          className="mkt-lang-menu"
          role="listbox"
          aria-label={label}
        >
          {SUPPORTED_LOCALES.map((item) => {
            const selected = item.id === locale;
            return (
              <li key={item.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={
                    selected ? "mkt-lang-option is-active" : "mkt-lang-option"
                  }
                  onClick={() => {
                    if (!isAppLocale(item.id)) return;
                    switchTo(item.id);
                  }}
                >
                  <span aria-hidden>{item.emoji}</span>
                  <span className="mkt-lang-option-name">{item.nativeName}</span>
                  <span className="mkt-lang-option-code">
                    {item.id.toUpperCase()}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
