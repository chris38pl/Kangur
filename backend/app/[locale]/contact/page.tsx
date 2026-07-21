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
    title: { absolute: t.meta.contactTitle },
    description: t.meta.contactDescription,
    openGraph: {
      title: t.meta.contactTitle,
      description: t.meta.contactDescription,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Kangur" }],
    },
  };
}

const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "contact@getkangur.com";

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="none">
      <path
        d="M4 6.5h16v11H4v-11Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="m4.5 7.5 7.5 5.5 7.5-5.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="none">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 8.5V12l2.75 2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="none">
      <path
        d="M5.5 17.5 4 20l3.2-1.1A8.2 8.2 0 0 0 12 20c4.4 0 8-3.1 8-7s-3.6-7-8-7-8 3.1-8 7c0 1.6.6 3.1 1.7 4.3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function ContactPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) notFound();
  const locale = raw as AppLocale;
  const t = getMessages(locale);
  const c = t.contact;

  return (
    <section className="mkt-contact">
      <div className="mkt-contact-copy">
        <h1>{c.title}</h1>
        <p className="mkt-contact-intro">{c.intro}</p>

        <ul className="mkt-contact-info">
          <li>
            <span className="mkt-contact-icon" aria-hidden>
              <IconMail />
            </span>
            <div>
              <strong>{c.emailLabel}</strong>
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </div>
          </li>
          <li>
            <span className="mkt-contact-icon" aria-hidden>
              <IconClock />
            </span>
            <div>
              <strong>{c.responseTitle}</strong>
              <p>{c.responseBody}</p>
            </div>
          </li>
          <li>
            <span className="mkt-contact-icon" aria-hidden>
              <IconChat />
            </span>
            <div>
              <strong>{c.helpTitle}</strong>
              <p>{c.helpBody}</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="mkt-contact-visual">
        <Image
          src="/kangur-contact-mascot.webp"
          alt={c.mascotAlt}
          width={560}
          height={560}
          className="mkt-contact-mascot"
          priority
          unoptimized
        />
      </div>
    </section>
  );
}
