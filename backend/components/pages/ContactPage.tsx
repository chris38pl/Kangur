import { JsonLd } from "@/components/marketing/JsonLd";
import { FactRows } from "@/components/site/FactRows";
import { PageHero } from "@/components/site/PageHero";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { contactCopy } from "@/lib/marketing/content/contact";
import type { AppLocale } from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";
import { rich } from "@/lib/marketing/rich-text";
import { routeHref } from "@/lib/marketing/routes";
import { pageStructuredData } from "@/lib/marketing/structured-data";

import styles from "./ContactPage.module.css";

export function ContactPage({ locale }: { locale: AppLocale }) {
  const c = contactCopy(locale);
  const { contact } = getMessages(locale).nav;

  return (
    <div data-full>
      <JsonLd data={pageStructuredData("contact", locale)} />
      <PageHero
        locale={locale}
        crumbs={[{ label: contact, href: routeHref("contact", locale) }]}
        eyebrow={contact}
        lines={c.lines}
        lead={<p>{c.lead}</p>}
        art={<Sticker name="z-lista" className={styles.kangur} priority="desktop" />}
      >
        <FactRows rows={c.rows} locale={locale} />
      </PageHero>

      <section className={prose.section}>
        <div className={`${prose.wrap} ${prose.prose}`}>
          <h2>{c.shortcutsTitle}</h2>
          <ul className={`${prose.cards} ${prose.threeUp}`}>
            {c.shortcuts.map((item) => (
              <li key={item.title} className={prose.card}>
                <h3>{item.title}</h3>
                <p>{rich(item.body, locale)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
