import { JsonLd } from "@/components/marketing/JsonLd";
import { ClosingBand } from "@/components/site/ClosingBand";
import { FaqList } from "@/components/site/FaqList";
import { PageHero } from "@/components/site/PageHero";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { FAQ, faqItems } from "@/lib/marketing/content/faq";
import { legalLocale, type AppLocale } from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";
import { rich } from "@/lib/marketing/rich-text";
import { routeHref } from "@/lib/marketing/routes";
import { faqStructuredData } from "@/lib/marketing/structured-data";

import styles from "./FaqPage.module.css";

/** Polish and English; other languages see the English answers in their own navigation. */
export function FaqPage({ locale }: { locale: AppLocale }) {
  const lang = legalLocale(locale);
  const c = FAQ[lang];
  const t = getMessages(locale).nav;
  const contentLang = lang === locale ? undefined : lang;

  return (
    <div data-full>
      {lang === locale ? (
        <JsonLd data={faqStructuredData(faqItems(lang), lang)} />
      ) : null}
      <PageHero
        locale={locale}
        crumbs={[{ label: t.faq, href: routeHref("faq", locale) }]}
        lines={c.lines}
        lead={<p>{rich(c.lead, locale)}</p>}
        contentLang={contentLang}
        art={<Sticker name="skron" className={styles.kangur} priority />}
      />
      <section className={prose.section} lang={contentLang}>
        <div className={`${prose.wrap} ${styles.groups}`}>
          {c.groups.map((group) => (
            <div key={group.title} className={styles.group}>
              <h2 className={styles.title}>{group.title}</h2>
              <FaqList
                items={group.items.map(({ q, a }) => ({
                  q,
                  a: <p>{rich(a, locale)}</p>,
                }))}
              />
            </div>
          ))}
        </div>
      </section>
      <ClosingBand locale={locale} page="faq" sticker="lezak" />
    </div>
  );
}
