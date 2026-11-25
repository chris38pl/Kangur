"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRef } from "react";

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
}: {
  links: readonly NavLink[];
  label: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const isCurrent = useIsCurrent();
  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  return (
    <details className="mkt-menu" ref={ref}>
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
    </details>
  );
}
