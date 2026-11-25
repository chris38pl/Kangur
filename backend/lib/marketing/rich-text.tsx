import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import type { AppLocale } from "@/lib/marketing/locale";
import { ROUTES, bestHref, type MarketingRouteId } from "@/lib/marketing/routes";
import { plainSpaces } from "@/lib/marketing/typography";

/**
 * Copy lives in plain strings, so it can be translated, checked and reused in structured
 * data. Two marks are enough:
 *
 *   [[pricing|Zobacz cennik]]          link to a page, in the best language for the reader
 *   [[https://cbos.pl|CBOS]]           link to another site
 *   **tak**                            strong
 */
const MARK = /\[\[([^\]|]+)\|([^\]]+)\]\]|\*\*([^*]+)\*\*/g;

export function rich(text: string, locale: AppLocale): ReactNode {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(MARK)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const [whole, target, label, strong] = match;
    if (strong) {
      nodes.push(<strong>{strong}</strong>);
    } else if (/^(https?:|mailto:|#)/.test(target)) {
      const external = target.startsWith("http");
      nodes.push(
        <a
          href={target}
          {...(external ? { target: "_blank", rel: "noopener" } : {})}
        >
          {label}
        </a>,
      );
    } else {
      const [id, hash] = target.split("#") as [MarketingRouteId, string?];
      if (!(id in ROUTES)) throw new Error(`Unknown page in copy: ${target}`);
      const { href, hrefLang } = bestHref(id, locale);
      nodes.push(
        <Link href={hash ? `${href}#${hash}` : href} hrefLang={hrefLang}>
          {label}
        </Link>,
      );
    }
    last = match.index + whole.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.map((node, index) => <Fragment key={index}>{node}</Fragment>);
}

/** The same text without marks, for structured data. */
export function plainText(text: string): string {
  return plainSpaces(
    text.replace(MARK, (_, __, label?: string, strong?: string) => label ?? strong ?? ""),
  );
}
