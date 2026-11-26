import { JsonLd } from "@/components/marketing/JsonLd";
import { PageHero } from "@/components/site/PageHero";
import prose from "@/components/site/prose.module.css";
import { deleteAccountCopy } from "@/lib/marketing/content/delete-account";
import type { AppLocale } from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";
import { rich } from "@/lib/marketing/rich-text";
import { routeHref } from "@/lib/marketing/routes";
import { pageStructuredData } from "@/lib/marketing/structured-data";

import styles from "./DeleteAccountPage.module.css";

/** Both stores link here. Plain on purpose: nobody is talked out of leaving. */
export function DeleteAccountPage({ locale }: { locale: AppLocale }) {
  const c = deleteAccountCopy(locale);
  const { deleteAccount } = getMessages(locale).nav;

  return (
    <div data-full>
      <JsonLd data={pageStructuredData("deleteAccount", locale)} />
      <PageHero
        locale={locale}
        crumbs={[{ label: deleteAccount, href: routeHref("deleteAccount", locale) }]}
        lines={c.lines}
        lead={<p>{c.lead}</p>}
      />
      <section className={prose.section}>
        <div className={`${prose.wrap} ${prose.prose}`}>
          <h2>{c.how.title}</h2>
          <ol className={styles.path}>
            {c.how.path.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>{c.how.confirm}</p>

          <ul className={prose.cards}>
            {[c.premium, c.effects].map((card) => (
              <li key={card.title} className={prose.card}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${prose.section} ${prose.tinted}`}>
        <div className={`${prose.wrap} ${prose.columns}`}>
          {[c.gone, c.stays].map((block) => (
            <div key={block.title} className={prose.prose}>
              <h2>{block.title}</h2>
              <ul>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className={prose.section}>
        <div className={`${prose.wrap} ${prose.prose}`}>
          <h2>{c.access.title}</h2>
          <p>{rich(c.access.body, locale)}</p>
          <p>{rich(c.more, locale)}</p>
        </div>
      </section>
    </div>
  );
}
