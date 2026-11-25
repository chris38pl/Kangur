"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { stripLocalePrefix } from "@/lib/marketing/locale";
import type { NavLink } from "@/lib/marketing/navigation";

/** Compared without the language prefix: `/faq` is prerendered as `/pl/faq`. */
function useIsCurrent() {
  const path = stripLocalePrefix(usePathname() || "/");
  return (href: string) =>
    !href.includes("#") && stripLocalePrefix(href) === path;
}

export function MarketingNav({
  links,
  ariaLabel,
}: {
  links: readonly NavLink[];
  ariaLabel: string;
}) {
  const isCurrent = useIsCurrent();
  return (
    <nav className="mkt-nav" aria-label={ariaLabel}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          hrefLang={link.hrefLang}
          className={isCurrent(link.href) ? "is-active" : undefined}
          aria-current={isCurrent(link.href) ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

/** Phones get the same links behind a button. Works before any script loads. */
export function MobileMenu({
  links,
  label,
  children,
}: {
  links: readonly NavLink[];
  label: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const isCurrent = useIsCurrent();
  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  // A native <details> opens by itself; closing it from outside is up to us.
  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(event.target as Node)) {
        ref.current.open = false;
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !ref.current?.open) return;
      ref.current.open = false;
      ref.current.querySelector("summary")?.focus();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details
      className="mkt-menu"
      ref={ref}
      onBlur={(event) => {
        // Focus went on to the page: the panel must not stay over it.
        const next = event.relatedTarget;
        if (next && !event.currentTarget.contains(next)) close();
      }}
    >
      <summary aria-label={label}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </summary>
      <div className="mkt-menu-panel">
        <nav aria-label={label}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              hrefLang={link.hrefLang}
              aria-current={isCurrent(link.href) ? "page" : undefined}
              onClick={close}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </details>
  );
}
