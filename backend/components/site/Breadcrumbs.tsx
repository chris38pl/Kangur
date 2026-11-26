import Link from "next/link";

import { JsonLd } from "@/components/marketing/JsonLd";
import { absoluteUrl } from "@/lib/marketing/site";
import { plainSpaces } from "@/lib/marketing/typography";

import styles from "./Breadcrumbs.module.css";

export type Crumb = { label: string; href: string };

/** The path to this page, for readers and for search results. The last crumb is the page. */
export function Breadcrumbs({
  crumbs,
  label,
}: {
  crumbs: readonly Crumb[];
  label: string;
}) {
  const last = crumbs.length - 1;
  return (
    <nav className={styles.nav} aria-label={label}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: plainSpaces(crumb.label),
            item: absoluteUrl(crumb.href),
          })),
        }}
      />
      <ol className={styles.list}>
        {crumbs.map((crumb, index) => (
          <li key={crumb.href}>
            {index === last ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link href={crumb.href}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
