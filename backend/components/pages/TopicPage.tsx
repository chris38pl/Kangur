import Link from "next/link";
import type { ReactNode } from "react";

import { JsonLd } from "@/components/marketing/JsonLd";
import { ClosingBand } from "@/components/site/ClosingBand";
import { FaqList } from "@/components/site/FaqList";
import { PageHero } from "@/components/site/PageHero";
import type { StickerName } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import type { TopicCopy, TopicSection } from "@/lib/marketing/content/topics/types";
import type { AppLocale } from "@/lib/marketing/locale";
import { rich } from "@/lib/marketing/rich-text";
import { bestHref, routeHref, type MarketingRouteId } from "@/lib/marketing/routes";
import { topicStructuredData } from "@/lib/marketing/structured-data";

import styles from "./TopicPage.module.css";

const TONES = {
  white: "",
  tinted: prose.tinted,
  cream: prose.cream,
  mint: styles.mint,
} as const;

const COLUMNS = { 2: "", 3: prose.threeUp, 4: prose.fourUp } as const;

type Slots = Record<string, ReactNode>;

/**
 * A page that answers one thing people type into a search engine. Copy is data, pictures
 * come in slots, so every page keeps its own shape.
 */
export function TopicPage({
  id,
  locale,
  copy,
  page,
  art,
  tone,
  slots = {},
  sticker,
  parent,
  printable = false,
  children,
}: {
  id: MarketingRouteId;
  locale: AppLocale;
  copy: TopicCopy;
  /** Reported to the stores for visitors without a campaign. */
  page: string;
  art?: ReactNode;
  tone?: "mint" | "peach" | "cream";
  slots?: Slots;
  sticker?: StickerName;
  /** Between "Kangur" and this page in the breadcrumbs. */
  parent?: { label: string; id: MarketingRouteId };
  /** Printing leaves only `children` on the paper. */
  printable?: boolean;
  /** Right below the hero, e.g. a tool. */
  children?: ReactNode;
}) {
  const faq = copy.sections.flatMap((section) =>
    section.kind === "faq" ? section.items : [],
  );

  const noprint = printable || undefined;

  return (
    <div data-full>
      {topicStructuredData(id, locale, copy, faq).map((data, index) => (
        <JsonLd key={index} data={data} />
      ))}
      <div data-noprint={noprint}>
        <PageHero
          locale={locale}
          crumbs={[
            ...(parent
              ? [{ label: parent.label, href: routeHref(parent.id, locale) }]
              : []),
            { label: copy.crumb, href: routeHref(id, locale) },
          ]}
          eyebrow={copy.eyebrow}
          lines={copy.lines}
          lead={copy.lead.map((p) => (
            <p key={p}>{rich(p, locale)}</p>
          ))}
          tone={tone}
          art={art}
        />
      </div>

      {children}

      <div data-noprint={noprint}>
        {copy.sections.map((section, index) => (
          <Section
            key={section.title ?? index}
            section={section}
            locale={locale}
            slots={slots}
          />
        ))}

        <section className={`${prose.section} ${prose.tinted}`}>
          <div className={`${prose.wrap} ${prose.prose}`}>
            <h2>{copy.related.title}</h2>
            <ul className={`${prose.cards} ${prose.threeUp}`}>
              {copy.related.items.map((item) => {
                const { href, hrefLang } = bestHref(item.id, locale);
                return (
                  <li key={item.id} className={`${prose.card} ${styles.related}`}>
                    <h3>
                      <Link href={href} hrefLang={hrefLang}>
                        {item.label}
                      </Link>
                    </h3>
                    <p>{item.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <ClosingBand
          locale={locale}
          page={page}
          sticker={sticker}
          lines={copy.closing?.lines}
          body={copy.closing?.body}
        />
      </div>
    </div>
  );
}

function Section({
  section,
  locale,
  slots,
}: {
  section: TopicSection;
  locale: AppLocale;
  slots: Slots;
}) {
  const shell = `${prose.section} ${TONES[section.tone ?? "white"]}`;
  const heading = (
    <>
      {section.title ? <h2>{section.title}</h2> : null}
      {section.intro ? <p>{rich(section.intro, locale)}</p> : null}
    </>
  );
  const outro = section.outro ? (
    <p className={prose.outro}>{rich(section.outro, locale)}</p>
  ) : null;

  switch (section.kind) {
    case "text": {
      const picture = section.slot ? slots[section.slot] : null;
      return (
        <section className={shell}>
          <div
            className={[
              prose.wrap,
              picture ? styles.split : "",
              picture && section.flip ? styles.flip : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className={prose.prose}>
              {heading}
              {section.body.map((p) => (
                <p key={p}>{rich(p, locale)}</p>
              ))}
              {section.list ? (
                <ul>
                  {section.list.map((item) => (
                    <li key={item}>{rich(item, locale)}</li>
                  ))}
                </ul>
              ) : null}
              {outro}
            </div>
            {picture ? <div className={styles.picture}>{picture}</div> : null}
          </div>
        </section>
      );
    }

    case "steps": {
      const picture = section.slot ? slots[section.slot] : null;
      return (
        <section className={shell}>
          <div className={`${prose.wrap} ${picture ? styles.split : ""}`}>
            <div className={prose.prose}>
              {heading}
              <ol
                className={
                  picture ? styles.steps : `${styles.steps} ${styles.stepsWide}`
                }
              >
                {section.items.map((item, index) => (
                  <li key={item.title}>
                    <span className={styles.number} aria-hidden>
                      {index + 1}
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{rich(item.body, locale)}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {outro}
            </div>
            {picture ? <div className={styles.picture}>{picture}</div> : null}
          </div>
        </section>
      );
    }

    case "cards":
      return (
        <section className={shell}>
          <div className={`${prose.wrap} ${prose.prose}`}>
            {heading}
            <ul className={`${prose.cards} ${COLUMNS[section.columns ?? 3]}`}>
              {section.items.map((item) => (
                <li key={item.title} className={prose.card}>
                  <h3>{item.title}</h3>
                  <p>{rich(item.body, locale)}</p>
                </li>
              ))}
            </ul>
            {outro}
          </div>
        </section>
      );

    case "table":
      return (
        <section className={shell}>
          <div className={`${prose.wrap} ${prose.prose}`}>
            {heading}
            <div className={prose.tableWrap}>
              <table
                className={[
                  prose.table,
                  styles.table,
                  section.highlight ? "" : styles.plain,
                ].join(" ")}
              >
                <caption className="visually-hidden">{section.caption}</caption>
                <thead>
                  <tr>
                    {section.head.map((cell, index) => (
                      <th key={cell || index} scope="col">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map(([first, ...rest]) => (
                    <tr key={first}>
                      <th scope="row">{rich(first, locale)}</th>
                      {rest.map((cell, index) => (
                        <td key={index}>{rich(cell, locale)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {outro}
          </div>
        </section>
      );

    case "fact":
      return (
        <section className={shell}>
          <div className={prose.wrap}>
            <blockquote className={styles.fact}>
              <p>{section.text}</p>
              <footer>
                <a href={section.href} target="_blank" rel="noopener">
                  {section.source}
                </a>
              </footer>
            </blockquote>
          </div>
        </section>
      );

    case "custom":
      return (
        <section className={shell}>
          <div className={prose.wrap}>
            <div className={prose.prose}>{heading}</div>
            {slots[section.slot]}
            <div className={prose.prose}>{outro}</div>
          </div>
        </section>
      );

    case "faq":
      return (
        <section className={shell}>
          <div className={`${prose.wrap} ${prose.narrow} ${prose.prose}`}>
            {heading}
            <FaqList
              items={section.items.map(({ q, a }) => ({
                q,
                a: <p>{rich(a, locale)}</p>,
              }))}
            />
          </div>
        </section>
      );
  }
}
