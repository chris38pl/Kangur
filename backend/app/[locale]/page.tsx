import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import {
  APP_LOCALE_IDS,
  isAppLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return APP_LOCALE_IDS.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) return {};
  const t = getMessages(raw);
  return {
    title: { absolute: t.meta.homeTitle },
    description: t.meta.homeDescription,
    openGraph: {
      title: t.meta.homeTitle,
      description: t.meta.homeDescription,
      locale: raw,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Kangur" }],
    },
  };
}

const playStoreUrl =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() ||
  "https://play.google.com/store/apps/details?id=app.getkangur.mobile";

function GooglePlayBadge() {
  return (
    <svg
      className="mkt-store-icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden
    >
      <path fill="#EA4335" d="M3.6 2.2 13.2 12 3.6 21.8V2.2Z" />
      <path fill="#FBBC04" d="m13.2 12 2.9 2.9 5.3-3c.7-.4.7-1.4 0-1.8l-5.3-3-2.9 2.9Z" />
      <path fill="#4285F4" d="M13.2 12 3.6 21.8c.3.5.9.8 1.5.8.3 0 .6-.1.9-.2l10.1-5.7L13.2 12Z" />
      <path fill="#34A853" d="M13.2 12 16.1 9.1 6 3.4c-.3-.2-.6-.2-.9-.2-.6 0-1.2.3-1.5.8L13.2 12Z" />
    </svg>
  );
}

function AppStoreBadge() {
  return (
    <svg
      className="mkt-store-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M18.7 12.7c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.7-1.7-3.3-1.7-1.4-.1-2.7.8-3.4.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.7 2.3-1.6 2.8-.4 6.9 1.1 9.2.8 1.1 1.7 2.4 2.9 2.3 1.2-.1 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c1-1.5 1.4-2.9 1.4-3 .1 0-2.7-1-2.8-3.4ZM15.5 5.8c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3Z"
      />
    </svg>
  );
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

          <div className="mkt-stores" id="pobierz">
            <a
              className="mkt-store-btn mkt-store-play"
              href={playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GooglePlayBadge />
              <span>
                <small>{t.home.playSmall}</small>
                Google Play
              </span>
            </a>
            <span
              className="mkt-store-btn mkt-store-ios"
              aria-disabled="true"
              title={t.home.iosDisabledTitle}
            >
              <AppStoreBadge />
              <span>
                <small>{t.home.iosSmall}</small>
                App Store
              </span>
            </span>
          </div>
          <p className="mkt-ios-note">{t.home.iosNote}</p>
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
