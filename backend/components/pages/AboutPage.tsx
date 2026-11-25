import { JsonLd } from "@/components/marketing/JsonLd";
import { ClosingBand } from "@/components/site/ClosingBand";
import { FactRows } from "@/components/site/FactRows";
import { PageHero } from "@/components/site/PageHero";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { ABOUT } from "@/lib/marketing/content/about";
import { routeHref } from "@/lib/marketing/routes";
import { pageStructuredData } from "@/lib/marketing/structured-data";

import styles from "./AboutPage.module.css";

export function AboutPage({ locale }: { locale: "pl" | "en" }) {
  const c = ABOUT[locale];

  return (
    <div data-full>
      <JsonLd data={pageStructuredData("about", locale)} />
      <PageHero
        locale={locale}
        crumbs={[{ label: c.crumb, href: routeHref("about", locale) }]}
        eyebrow={c.eyebrow}
        lines={c.lines}
        lead={c.lead.map((p) => (
          <p key={p}>{p}</p>
        ))}
        tone="peach"
        art={<Sticker name="z-koszykiem" className={styles.hero} priority />}
      />

      <section className={prose.section}>
        <div className={`${prose.wrap} ${prose.columns}`}>
          <div className={prose.prose}>
            <h2>{c.why.title}</h2>
            {c.why.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <h3>{c.animal.title}</h3>
            {c.animal.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className={prose.prose}>
            <h2>{c.timeline.title}</h2>
            <ol className={styles.timeline}>
              {c.timeline.items.map((item) => (
                <li key={item.when}>
                  <strong>{item.when}</strong>
                  <span>{item.what}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className={`${prose.section} ${prose.tinted}`}>
        <div className={`${prose.wrap} ${prose.prose}`}>
          <h2>{c.beliefs.title}</h2>
          <p>{c.beliefs.intro}</p>
          <ul className={`${prose.cards} ${prose.threeUp}`}>
            {c.beliefs.items.map((item) => (
              <li key={item.title} className={prose.card}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={prose.section}>
        <div className={`${prose.wrap} ${prose.columns}`}>
          <div className={prose.prose}>
            <h2>{c.who.title}</h2>
            {c.who.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <FactRows rows={c.who.rows} locale={locale} />
          </div>
          <div className={prose.prose}>
            <h2>{c.notUs.title}</h2>
            <p>{c.notUs.intro}</p>
            <FactRows rows={c.notUs.rows} locale={locale} />
            <p className={prose.outro}>
              <strong>{c.notUs.outro}</strong>
            </p>
          </div>
        </div>
      </section>

      <ClosingBand
        locale={locale}
        page="o-kangurze"
        sticker="cwaniak"
        lines={c.closing.lines}
        body={c.closing.body}
      />
    </div>
  );
}
