import { JsonLd } from "@/components/marketing/JsonLd";
import { ClosingBand } from "@/components/site/ClosingBand";
import { FaqList } from "@/components/site/FaqList";
import { PageHero } from "@/components/site/PageHero";
import { Receipt } from "@/components/site/Receipt";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { PRICING } from "@/lib/marketing/content/pricing";
import { rich } from "@/lib/marketing/rich-text";
import { routeHref } from "@/lib/marketing/routes";
import { pageStructuredData } from "@/lib/marketing/structured-data";

import styles from "./PricingPage.module.css";

export function PricingPage({ locale }: { locale: "pl" | "en" }) {
  const c = PRICING[locale];

  return (
    <div data-full>
      <JsonLd data={pageStructuredData("pricing", locale)} />
      <PageHero
        locale={locale}
        crumbs={[{ label: c.crumb, href: routeHref("pricing", locale) }]}
        eyebrow={c.eyebrow}
        lines={c.lines}
        lead={c.lead.map((p) => (
          <p key={p}>{p}</p>
        ))}
        tone="cream"
        art={<Receipt lines={c.receipt} label={c.receiptLabel} />}
      />

      <section className={prose.section}>
        <div className={`${prose.wrap} ${prose.prose}`}>
          <h2>{c.table.title}</h2>
          <p>{c.table.intro}</p>
          <div className={prose.tableWrap}>
            <table className={prose.table}>
              <caption className="visually-hidden">{c.table.caption}</caption>
              <thead>
                <tr>
                  {c.table.head.map((cell, index) => (
                    <th key={cell || index} scope="col">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.table.rows.map(([name, free, premium]) => (
                  <tr key={name}>
                    <th scope="row">{name}</th>
                    <td>{free}</td>
                    <td>{premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={prose.source}>{c.table.note}</p>
        </div>
      </section>

      <section className={`${prose.section} ${prose.tinted}`}>
        <div className={`${prose.wrap} ${prose.prose}`}>
          <h2>{c.uses.title}</h2>
          <p>{c.uses.intro}</p>
          <ul className={prose.cards}>
            {c.uses.items.map((item) => (
              <li key={item.title} className={prose.card}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
          <p className={styles.outro}>{c.uses.outro}</p>
        </div>
      </section>

      <section className={prose.section}>
        <div className={`${prose.wrap} ${styles.family}`}>
          <Sticker name="korona-premium" className={styles.kangur} />
          <div className={prose.prose}>
            <h2>{c.family.title}</h2>
            {c.family.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className={`${prose.section} ${prose.tinted}`}>
        <div className={`${prose.wrap} ${prose.narrow} ${prose.prose}`}>
          <h2>{c.faqTitle}</h2>
          <FaqList
            items={c.faq.map(({ q, a }) => ({ q, a: <p>{rich(a, locale)}</p> }))}
          />
        </div>
      </section>

      <ClosingBand locale={locale} page="cennik" sticker="z-koszykiem" />
    </div>
  );
}
