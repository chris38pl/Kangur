"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

type NavLink = { href: string; label: string };

export function MarketingNav({
  links,
  ariaLabel,
}: {
  links: readonly NavLink[];
  ariaLabel: string;
}) {
  const pathname = usePathname() || "";

  return (
    <nav className="mkt-nav" aria-label={ariaLabel}>
      {links.map((link) => {
        const pathOnly = link.href.split("#")[0] ?? link.href;
        const active =
          pathOnly === pathname ||
          (pathOnly.endsWith("/contact") && pathname.endsWith("/contact"));
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
