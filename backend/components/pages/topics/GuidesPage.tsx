import Link from "next/link";

import { JsonLd } from "@/components/marketing/JsonLd";
import { ClosingBand } from "@/components/site/ClosingBand";
import { Pill } from "@/components/site/Headline";
import { PageHero } from "@/components/site/PageHero";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { GUIDES } from "@/lib/marketing/content/topics/guides";
import { routeHref } from "@/lib/marketing/routes";
import { pageStructuredData } from "@/lib/marketing/structured-data";

import styles from "./GuidesPage.module.css";

export function GuidesPage() {
  const c = GUIDES;
  return (
    <div data-full>
      <JsonLd data={pageStructuredData("guides", "pl")} />
      <PageHero
        locale="pl"
        crumbs={[{ label: c.crumb, href: routeHref("guides", "pl") }]}
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
              </li>
            ))}
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

      <ClosingBand locale="pl" page="poradniki" />
    </div>
  );
}
