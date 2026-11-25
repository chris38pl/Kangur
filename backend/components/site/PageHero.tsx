import type { ReactNode } from "react";

import { Breadcrumbs, type Crumb } from "@/components/site/Breadcrumbs";
import { Headline } from "@/components/site/Headline";
import { withLocale, type AppLocale } from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";

import styles from "./PageHero.module.css";

/** Top of every page except home: where you are, what it is, the answer in two sentences. */
export function PageHero({
  locale,
  crumbs,
  eyebrow,
  lines,
  lead,
  art,
  tone = "mint",
  children,
}: {
  locale: AppLocale;
  /** Between "Kangur" and nothing: the last one is this page. */
  crumbs: readonly Crumb[];
  eyebrow?: string;
  lines: readonly [string, string?];
  lead: ReactNode;
  art?: ReactNode;
  tone?: "mint" | "peach" | "cream";
  children?: ReactNode;
}) {
  return (
    <section className={`${styles.hero} ${styles[tone]}`}>
      <div className={`${styles.grid} ${art ? styles.withArt : ""}`}>
        <div className={styles.copy}>
          <Breadcrumbs
            label={getMessages(locale).nav.breadcrumbAria}
            crumbs={[{ label: "Kangur", href: withLocale(locale, "/") }, ...crumbs]}
          />
          <Headline as="h1" size="xl" eyebrow={eyebrow} lines={lines} />
          <div className={styles.lead}>{lead}</div>
          {children}
        </div>
        {art ? <div className={styles.art}>{art}</div> : null}
      </div>
    </section>
  );
}
