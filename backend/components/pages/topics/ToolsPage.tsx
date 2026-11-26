import Link from "next/link";
import type { ReactNode } from "react";

import { JsonLd } from "@/components/marketing/JsonLd";
import { ClosingBand } from "@/components/site/ClosingBand";
import { Pill } from "@/components/site/Headline";
import { PageHero } from "@/components/site/PageHero";
import { Picture } from "@/components/site/Picture";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { HANDOFF } from "@/lib/marketing/content/topics/handoff";
import { TOOLS } from "@/lib/marketing/content/topics/tools";
import { SCREENS } from "@/lib/marketing/images.generated";
import { routeHref, type MarketingRouteId } from "@/lib/marketing/routes";
import { pageStructuredData } from "@/lib/marketing/structured-data";

import styles from "./ToolsPage.module.css";

/** The same Kangur who opens the page the card leads to. */
const ART: Partial<Record<MarketingRouteId, ReactNode>> = {
  christmasTool: <Sticker name="z-torba" className={styles.art} />,
  weekTool: <Sticker name="z-koszykiem" className={`${styles.art} ${styles.whole}`} />,
  aisleTool: <Sticker name="z-lista" className={styles.art} />,
};

export function ToolsPage() {
  const c = TOOLS;
  return (
    <div data-full>
      <JsonLd data={pageStructuredData("tools", "pl")} />
      <PageHero
        locale="pl"
        crumbs={[{ label: c.crumb, href: routeHref("tools", "pl") }]}
        eyebrow={c.eyebrow}
        lines={c.lines}
        lead={c.lead.map((p) => (
          <p key={p}>{p}</p>
        ))}
        tone="cream"
        art={<Sticker name="lezak" className={styles.kangur} priority />}
      />

      <section className={prose.section}>
        <div className={prose.wrap}>
          <ul className={styles.entries}>
            {c.entries.map((entry) => (
              <li key={entry.id} className={`${styles.entry} ${styles[entry.tone]}`}>
                <Pill>{entry.tag}</Pill>
                <h2>
                  <Link href={routeHref(entry.id, "pl")}>{entry.label}</Link>
                </h2>
                <p>{entry.body}</p>
                {ART[entry.id]}
              </li>
            ))}
            {/* Where each of them ends, on the real Start screen. */}
            <li className={`${styles.entry} ${styles.cream} ${styles.after}`}>
              <Pill>{c.after.tag}</Pill>
              <h2>{c.after.title}</h2>
              <p>{c.after.body}</p>
              <Picture
                image={SCREENS.pl.startQuick}
                alt={HANDOFF.open.alt}
                sizes="(max-width: 759px) 86vw, 480px"
                className={styles.screen}
              />
              <p>
                <Link href={routeHref("sharedList", "pl")}>{c.after.link}</Link>
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section className={`${prose.section} ${prose.tinted}`}>
        <div className={`${prose.wrap} ${prose.prose}`}>
          <h2>{c.topicsTitle}</h2>
          <ul className={`${prose.cards} ${prose.fourUp}`}>
            {c.topics.map((topic) => (
              <li key={topic.id} className={`${prose.card} ${styles.topic}`}>
                <h3>
                  <Link href={routeHref(topic.id, "pl")}>{topic.label}</Link>
                </h3>
                <p>{topic.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ClosingBand locale="pl" page="narzedzia" />
    </div>
  );
}
