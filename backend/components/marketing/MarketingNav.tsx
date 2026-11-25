"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import { stripLocalePrefix } from "@/lib/marketing/locale";

type NavLink = { href: string; label: string };

export function MarketingNav({
  links,
  ariaLabel,
}: {
  links: readonly NavLink[];
  ariaLabel: string;
}) {
  // Compared without the language prefix: `/faq` is prerendered as `/pl/faq`.
  const path = stripLocalePrefix(usePathname() || "/");

  return (
    <nav className="mkt-nav" aria-label={ariaLabel}>
      {links.map((link) => {
        const target = stripLocalePrefix(link.href.split("#")[0] ?? link.href);
        const active = target === path && !link.href.includes("#");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "is-active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
