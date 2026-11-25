import { JsonLd } from "@/components/marketing/JsonLd";
import { ClosingBand } from "@/components/site/ClosingBand";
import { FactRows } from "@/components/site/FactRows";
import { FaqList } from "@/components/site/FaqList";
import { PageHero } from "@/components/site/PageHero";
import { ProductLabel } from "@/components/site/ProductLabel";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { SAFETY } from "@/lib/marketing/content/safety";
import { rich } from "@/lib/marketing/rich-text";
import { routeHref } from "@/lib/marketing/routes";
import { faqStructuredData, pageStructuredData } from "@/lib/marketing/structured-data";

import styles from "./SafetyPage.module.css";

export function SafetyPage({ locale }: { locale: "pl" | "en" }) {
  const c = SAFETY[locale];

  return (
    <div data-full>
      <JsonLd data={pageStructuredData("safety", locale)} />
      <JsonLd data={faqStructuredData(c.faq, locale)} />
      <PageHero
        locale={locale}
        crumbs={[{ label: c.crumb, href: routeHref("safety", locale) }]}
        eyebrow={c.eyebrow}
        lines={c.lines}
        lead={c.lead.map((p) => (
          <p key={p}>{p}</p>
        ))}
        art={
          <ProductLabel
            title={c.label.title}
            subtitle={c.label.subtitle}
            rows={c.label.rows}
            footer={c.label.footer}
          />
        }
      />

      <section className={prose.section}>
        <div className={`${prose.wrap} ${prose.prose}`}>
          <h2>{c.permissions.title}</h2>
          <p>{c.permissions.intro}</p>
          <ul className={`${prose.cards} ${prose.fourUp}`}>
            {c.permissions.items.map((item) => (
              <li key={item.title} className={prose.card}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
          <p className={prose.outro}>{c.permissions.outro}</p>
        </div>
      </section>

      <section className={`${prose.section} ${prose.tinted}`}>
        <div className={`${prose.wrap} ${prose.prose}`}>
          <h2>{c.screenshot.title}</h2>
          <p>{c.screenshot.intro}</p>
          <ol className={`${prose.cards} ${prose.threeUp} ${styles.steps}`}>
            {c.screenshot.steps.map((step, index) => (
              <li key={step.title} className={prose.card}>
                <span className={styles.number} aria-hidden>
                  {index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
          <div className={prose.outro}>
            {c.screenshot.outro.map((p) => (
              <p key={p}>{rich(p, locale)}</p>
            ))}
          </div>
        </div>
      </section>

      <section className={prose.section}>
        <div className={`${prose.wrap} ${prose.columns}`}>
          <div className={prose.prose}>
            <h2>{c.check.title}</h2>
            <p>{c.check.intro}</p>
            <FactRows rows={c.check.rows} locale={locale} />
          </div>
          <div className={`${prose.prose} ${styles.never}`}>
            <Sticker name="cwaniak" className={styles.kangur} />
            <h2>{c.never.title}</h2>
            <p>{c.never.intro}</p>
            <ul>
              {c.never.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              <strong>{c.never.outro}</strong>
            </p>
          </div>
        </div>
      </section>

      <section className={`${prose.section} ${prose.cream}`}>
        <div className={`${prose.wrap} ${prose.columns}`}>
          <div className={prose.prose}>
            <h2>{c.other.title}</h2>
            {c.other.body.map((p) => (
              <p key={p}>{rich(p, locale)}</p>
            ))}
          </div>
          <div className={prose.prose}>
            <h2>{c.help.title}</h2>
            <p>{c.help.intro}</p>
            <ol>
              {c.help.steps.map((step) => (
                <li key={step}>{rich(step, locale)}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className={prose.section}>
        <div className={`${prose.wrap} ${prose.narrow} ${prose.prose}`}>
          <h2>{c.faqTitle}</h2>
          <FaqList
            items={c.faq.map(({ q, a }) => ({ q, a: <p>{rich(a, locale)}</p> }))}
          />
        </div>
      </section>

      <ClosingBand
        locale={locale}
        page="bezpieczenstwo"
        sticker="kciuki"
        lines={c.closing.lines}
        body={c.closing.body}
      />
    </div>
  );
}
