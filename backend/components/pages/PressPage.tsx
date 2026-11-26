import Image from "next/image";

import { JsonLd } from "@/components/marketing/JsonLd";
import { ClosingBand } from "@/components/site/ClosingBand";
import { CopyBox } from "@/components/site/CopyBox";
import { FactRows } from "@/components/site/FactRows";
import { PageHero } from "@/components/site/PageHero";
import { Season } from "@/components/site/Season";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { PRESS, PRESS_FILES } from "@/lib/marketing/content/press";
import { rich } from "@/lib/marketing/rich-text";
import { routeHref } from "@/lib/marketing/routes";
import { isOver } from "@/lib/marketing/season";
import { pageStructuredData } from "@/lib/marketing/structured-data";

import styles from "./PressPage.module.css";

export function PressPage({ locale }: { locale: "pl" }) {
  const c = PRESS;

  return (
    <div data-full>
      <JsonLd data={pageStructuredData("press", locale)} />
      <PageHero
        locale={locale}
        crumbs={[{ label: c.crumb, href: routeHref("press", locale) }]}
        eyebrow={c.eyebrow}
        lines={c.lines}
        lead={c.lead.map((p) => (
          <p key={p}>{rich(p, locale)}</p>
        ))}
        art={<Sticker name="z-lista" className={styles.hero} priority />}
      />

      <section className={prose.section}>
        <div className={`${prose.wrap} ${prose.columns}`}>
          <div className={prose.prose}>
            <h2>{c.short.title}</h2>
            <CopyBox text={c.short.text} label="Kopiuj" done="Skopiowane" />
            <h2 className={prose.next}>{c.long.title}</h2>
            <CopyBox text={c.long.text} label="Kopiuj" done="Skopiowane" />
          </div>
          <div className={prose.prose}>
            <h2>{c.factsTitle}</h2>
            <FactRows rows={c.facts} locale={locale} />
          </div>
        </div>
      </section>

      <section className={`${prose.section} ${prose.cream}`}>
        <div className={`${prose.wrap} ${prose.prose}`}>
          <h2>{c.nameTitle}</h2>
          {c.name.map((p) => (
            <p key={p}>{rich(p, locale)}</p>
          ))}
        </div>
      </section>

      <section className={prose.section}>
        <div className={`${prose.wrap} ${prose.prose}`}>
          <h2>{c.ideasTitle}</h2>
          <ul className={`${prose.cards} ${styles.ideas}`}>
            {c.ideas.filter((idea) => !idea.until || !isOver(idea.until)).map((idea) => {
              const card = (
                <li key={idea.title} className={`${prose.card} ${styles.idea}`}>
                  <h3>{idea.title}</h3>
                  <p>{rich(idea.body, locale)}</p>
                  {idea.source ? (
                    <p className={prose.source}>{rich(idea.source, locale)}</p>
                  ) : null}
                </li>
              );
              return idea.until ? (
                <Season key={idea.title} until={idea.until}>
                  {card}
                </Season>
              ) : (
                card
              );
            })}
          </ul>
        </div>
      </section>

      <section className={`${prose.section} ${prose.tinted}`}>
        <div className={`${prose.wrap} ${prose.prose}`}>
          <h2>{c.filesTitle}</h2>
          <p>{c.filesIntro}</p>
          <ul className={styles.files}>
            {PRESS_FILES.map(({ file, label, info }) => (
              <li key={file}>
                <a href={file} download>
                  <span className={styles.thumb}>
                    <Image
                      src={file}
                      alt=""
                      width={320}
                      height={240}
                      sizes="200px"
                    />
                  </span>
                  <strong>{label}</strong>
                  <small>{info}</small>
                </a>
              </li>
            ))}
          </ul>
          <h3>{c.contactTitle}</h3>
          <p>{rich(c.contact, locale)}</p>
        </div>
      </section>

      <ClosingBand
        locale={locale}
        page="dla-mediow"
        lines={c.closing.lines}
        body={c.closing.body}
      />
    </div>
  );
}
