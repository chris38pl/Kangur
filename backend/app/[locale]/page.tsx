import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import {
  isAppLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import { JsonLd } from "@/components/marketing/JsonLd";
import { StoreButtons } from "@/components/marketing/StoreButtons";
import { getMessages } from "@/lib/marketing/messages";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/marketing/site";
import { homeStructuredData } from "@/lib/marketing/structured-data";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) return {};
  return buildMarketingMetadata("home", raw);
}

const highlightIcons = [
  <svg
    key="family"
    viewBox="0 0 24 24"
    width="32"
    height="32"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M16 19v-2a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v2" />
    <circle cx="10" cy="8" r="3" />
    <path d="M20 19v-2a3 3 0 0 0-2-2.8" />
    <path d="M15 5.2a3 3 0 0 1 0 5.6" />
  </svg>,
  <svg
    key="shield"
    viewBox="0 0 24 24"
    width="32"
    height="32"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 3 5 6v5c0 4.5 3.1 8.7 7 9.8 3.9-1.1 7-5.3 7-9.8V6l-7-3Z" />
    <path d="m9.5 12 1.8 1.8L15 10" />
  </svg>,
  <svg
    key="check"
    viewBox="0 0 24 24"
    width="32"
    height="32"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="9" />
    <path d="m9 12 2 2 4-4" />
  </svg>,
] as const;

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) notFound();
  const locale = raw as AppLocale;
  const t = getMessages(locale);

  return (
    <>
      <JsonLd data={homeStructuredData(locale)} />
      <section className="mkt-hero-section">
        <div className="mkt-hero-copy">
          <p className="mkt-badge">{t.home.badge}</p>
          <h1>
            {t.home.headlineBefore}{" "}
            <span className="mkt-accent">{t.home.headlineAccent}</span>
          </h1>
          <p className="mkt-lead">{t.home.lead}</p>
          <ul className="mkt-checklist">
            {t.home.features.map((item) => (
              <li key={item}>
                <span className="mkt-check" aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          <StoreButtons
            id="pobierz"
            appStoreUrl={APP_STORE_URL}
            playStoreUrl={PLAY_STORE_URL}
            appStoreSmall={t.home.iosSmall}
            playSmall={t.home.playSmall}
          />
          <p className="mkt-stores-note">{t.home.storesNote}</p>
        </div>

        <div className="mkt-hero-visual">
          <div className="mkt-hero-glow" aria-hidden />
          <Image
            className="mkt-hero-img"
            src="/kangur-hero-phone.webp"
            alt={t.home.heroAlt}
            width={1024}
            height={935}
            priority
            quality={90}
            unoptimized
            sizes="(max-width: 900px) 92vw, 520px"
          />
        </div>
      </section>

      <section
        className="mkt-highlights-band"
        id="funkcje"
        aria-label={t.home.highlightsAria}
      >
        <div className="mkt-highlights">
          {t.home.highlights.map((item, index) => (
            <article key={item.title} className="mkt-highlight-card">
              <div className="mkt-highlight-icon">{highlightIcons[index]}</div>
              <div className="mkt-highlight-copy">
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
