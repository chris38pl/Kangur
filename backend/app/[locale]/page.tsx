import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/marketing/JsonLd";
import { StoreButtons } from "@/components/marketing/StoreButtons";
import { ChatCard } from "@/components/site/ChatCard";
import { ClosingBand } from "@/components/site/ClosingBand";
import { FaqList } from "@/components/site/FaqList";
import { Headline, Pill } from "@/components/site/Headline";
import { LoopVideo } from "@/components/site/LoopVideo";
import { Notepad } from "@/components/site/Notepad";
import { Phone } from "@/components/site/Phone";
import { Receipt } from "@/components/site/Receipt";
import { Season } from "@/components/site/Season";
import { Sticker } from "@/components/site/Sticker";
import { homeCopy } from "@/lib/marketing/content/home";
import { SCREENS } from "@/lib/marketing/images.generated";
import { isAppLocale } from "@/lib/marketing/locale";
import { rich } from "@/lib/marketing/rich-text";
import { bestHref, type MarketingRouteId } from "@/lib/marketing/routes";
import { AISLE_LOOP, screensFor } from "@/lib/marketing/screens";
import { isOver } from "@/lib/marketing/season";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/marketing/site";
import { homeStructuredData } from "@/lib/marketing/structured-data";

import styles from "./home.module.css";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) return {};
  return buildMarketingMetadata("home", raw);
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();

  const c = homeCopy(locale);
  const screens = screensFor(locale);
  const polish = locale === "pl";
  // The three messages that tell the story; step 1 has the whole conversation.
  const heroChat = {
    ...c.chat,
    messages: [0, 2, 6].map((i) => c.chat.messages[i]),
  };

  const link = (id: MarketingRouteId, label: string) => {
    const { href, hrefLang } = bestHref(id, locale);
    return (
      <Link className={styles.textLink} href={href} hrefLang={hrefLang}>
        {label}
        <span aria-hidden> →</span>
      </Link>
    );
  };

  /** Only where the page exists in the reader's language. */
  const more = (id: keyof NonNullable<typeof c.more>) => {
    const label = c.more?.[id];
    return label ? <p className={styles.more}>{link(id, label)}</p> : null;
  };

  return (
    <div data-full className={styles.home}>
      <JsonLd data={homeStructuredData(locale)} />

      <section className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <Headline
              as="h1"
              size="xl"
              eyebrow={c.hero.eyebrow}
              lines={c.hero.lines}
            />
            <p className={styles.lead}>{c.hero.lead}</p>
            <StoreButtons
              id="pobierz"
              appStoreUrl={APP_STORE_URL}
              playStoreUrl={PLAY_STORE_URL}
              appStoreSmall={c.hero.iosSmall}
              playSmall={c.hero.playSmall}
              page="home"
            />
            <p className={styles.note}>{c.hero.storesNote}</p>
          </div>

          <div className={styles.heroArt}>
            <Sticker name="kciuki" className={styles.heroKangur} />
            <ChatCard
              chat={heroChat}
              label={c.hero.chatLabel}
              className={styles.heroChat}
            />
            <Phone
              image={screens.import}
              alt={c.hero.screenAlt}
              className={styles.heroPhone}
              sizes="(max-width: 899px) 220px, 270px"
              priority="desktop"
            />
          </div>
        </div>
      </section>

      {c.season && !isOver(c.season.until) ? (
        <Season until={c.season.until}>
          <div className={styles.wrap}>
            <div className={styles.season}>
              <div>
                <Headline size="md" lines={c.season.lines} />
                <p>{c.season.body}</p>
                <Link className={styles.seasonLink} href={bestHref(c.season.id, locale).href}>
                  {c.season.link}
                </Link>
              </div>
              <Sticker name="z-torba" className={styles.seasonKangur} />
            </div>
          </div>
        </Season>
      ) : null}

      <section className={styles.section} id="jak-dziala">
        <div className={styles.wrap}>
          <Headline lines={c.steps.lines} className={styles.centered} />
          <ol className={styles.steps}>
            {c.steps.items.map((step, index) => (
              <li key={step.title} className={styles.step}>
                <div className={styles.stepCopy}>
                  <Pill>{step.pill}</Pill>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
                <div className={styles.stepArt}>
                  {index === 0 ? (
                    <ChatCard
                      chat={c.chat}
                      label={c.hero.chatLabel}
                      className={styles.stepChat}
                    />
                  ) : null}
                  {index === 1 ? (
                    <Phone
                      image={screens.import}
                      alt=""
                      className={styles.stepPhone}
                      time="17:55"
                    />
                  ) : null}
                  {index === 2 ? (
                    <Phone
                      image={screens.aisle}
                      alt={c.steps.screenAlt}
                      className={styles.stepPhone}
                      time="18:12"
                    >
                      {polish ? (
                        <LoopVideo
                          {...AISLE_LOOP}
                          label={c.steps.screenAlt}
                          pauseLabel="Zatrzymaj nagranie"
                          playLabel="Odtwórz nagranie"
                          className={styles.video}
                        />
                      ) : undefined}
                    </Phone>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${styles.section} ${styles.flush}`}>
        <div className={styles.wrap}>
          <div className={styles.intro}>
            <Headline lines={c.ways.lines} />
            <p className={styles.lead}>{c.ways.intro}</p>
          </div>
          <div className={styles.ways}>
            <article className={`${styles.way} ${styles.wayPhoto}`}>
              <div className={styles.wayCopy}>
                <h3>{c.ways.photo.title}</h3>
                <p>{c.ways.photo.body}</p>
                {more("photoList")}
                {more("guidePrint")}
              </div>
              <div className={styles.wayNote}>
                <Notepad lines={c.ways.photo.note} locale={locale} />
              </div>
            </article>

            <article className={`${styles.way} ${styles.wayDish}`}>
              <div className={styles.wayCopy}>
                <h3>{c.ways.dish.title}</h3>
                <p>{c.ways.dish.body}</p>
                {more("recipeList")}
              </div>
              <Phone
                image={screens.meal}
                alt={c.ways.dish.screenAlt}
                cropped
                className={styles.wayPhone}
                time="16:40"
              />
            </article>

            <article className={`${styles.way} ${styles.wayUsual}`}>
              <div className={styles.wayCopy}>
                <h3>{c.ways.usual.title}</h3>
                <p>{c.ways.usual.body}</p>
                {more("guideWeek")}
              </div>
              {screens.history ? (
                <Phone
                  image={screens.history}
                  alt={c.ways.usual.screenAlt}
                  cropped
                  className={styles.wayPhone}
                  time="9:15"
                />
              ) : (
                <Sticker name="skron" className={styles.wayKangur} />
              )}
            </article>

            <article className={`${styles.way} ${styles.wayTyped}`}>
              <div className={styles.wayCopy}>
                <h3>{c.ways.typed.title}</h3>
                <p>{c.ways.typed.body}</p>
                {more("aisleTool")}
                {more("aiList")}
              </div>
              <div className={styles.wayChips} aria-hidden>
                {c.ways.typed.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
              <Sticker name="z-lista" className={styles.wayKangurLow} />
            </article>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.tinted}`}>
        <div className={`${styles.wrap} ${styles.split}`}>
          <div>
            <Headline lines={c.together.lines} />
            <p className={styles.lead}>{c.together.body}</p>
            <ul className={styles.points}>
              {c.together.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            {more("sharedList")}
            {c.together.fact ? (
              <blockquote className={styles.fact}>
                <p>{c.together.fact.text}</p>
                <footer>
                  <a
                    href={c.together.fact.href}
                    target="_blank"
                    rel="noopener"
                  >
                    {c.together.fact.source}
                  </a>
                </footer>
              </blockquote>
            ) : null}
          </div>
          {polish && c.together.added ? (
            <div className={styles.pair}>
              <Phone
                image={SCREENS.pl.quick}
                alt={c.together.screenAlt}
                className={styles.pairLeft}
                sizes="(max-width: 700px) 46vw, 244px"
                time="17:20"
              />
              <Phone
                image={SCREENS.pl.quick}
                alt=""
                className={styles.pairRight}
                sizes="(max-width: 700px) 46vw, 244px"
                time="17:20"
              />
              <span className={styles.pairNoteLeft}>{c.together.added[0]}</span>
              <span className={styles.pairNoteRight}>{c.together.added[1]}</span>
            </div>
          ) : (
            <div className={styles.single}>
              <Phone image={screens.space} alt={c.together.screenAlt} time="17:20" />
            </div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.wrap} ${styles.split} ${styles.reverse}`}>
          <div className={styles.summaryArt}>
            <Sticker name="smutny" className={styles.summaryKangur} />
            <Phone
              image={polish ? SCREENS.pl.missing : screens.summary}
              alt={c.summary.screenAlt}
              className={styles.summaryPhone}
              sizes="(max-width: 519px) 57vw, 268px"
              time="22:14"
            />
          </div>
          <div>
            <Headline lines={c.summary.lines} />
            <p className={styles.lead}>{c.summary.body}</p>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.cream}`}>
        <div className={`${styles.wrap} ${styles.split}`}>
          <div>
            <Headline lines={c.price.lines} />
            <p className={styles.lead}>{c.price.body}</p>
            <p>{link("pricing", c.price.link)}</p>
          </div>
          <div className={styles.receipt}>
            <Receipt lines={c.price.receipt} label={c.price.receiptLabel} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.wrap} ${styles.maker}`}>
          <Sticker name="medytacja" className={styles.makerKangur} />
          <div>
            <Headline lines={c.maker.lines} />
            <p className={styles.lead}>{c.maker.body}</p>
            <ul className={styles.makerPoints}>
              {c.maker.points.map((point) => (
                <li key={point.title}>
                  <strong>{point.title}</strong>
                  {point.body}
                </li>
              ))}
            </ul>
            <p className={styles.links}>
              {link("safety", c.maker.safetyLink)}
              {link("about", c.maker.aboutLink)}
            </p>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.soft}`}>
        <div className={`${styles.wrap} ${styles.faq}`}>
          <Headline lines={c.faq.lines} />
          <FaqList
            items={c.faq.items.map(({ q, a }) => ({
              q,
              a: <p>{rich(a, locale)}</p>,
            }))}
          />
        </div>
      </section>

      <ClosingBand locale={locale} page="home" />
    </div>
  );
}
