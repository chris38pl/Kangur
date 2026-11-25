import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { UtmCapture } from "@/components/marketing/UtmCapture";
import {
  APP_LOCALE_IDS,
  SITE_DEFAULT_LOCALE,
  isAppLocale,
  withLocale,
} from "@/lib/marketing/locale";
import { LegalEntityLine } from "@/lib/marketing/legal-entity";
import { getMessages } from "@/lib/marketing/messages";
import { pageMeta } from "@/lib/marketing/page-meta";
import {
  APP_STORE_ID,
  IS_PRODUCTION_SITE,
  SITE_URL,
} from "@/lib/marketing/site";

import "../globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

type Params = Promise<{ locale: string }>;

/** Only the ten languages exist; anything else in their place is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return APP_LOCALE_IDS.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#43BFA8",
  colorScheme: "light",
};

/** Everything a page does not say itself. */
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isAppLocale(raw) ? raw : SITE_DEFAULT_LOCALE;
  const { title, description } = pageMeta("home", locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: "%s | Kangur" },
    description,
    applicationName: "Kangur",
    ...(IS_PRODUCTION_SITE ? {} : { robots: { index: false, follow: false } }),
    icons: {
      // /favicon.ico comes from the app/favicon.ico file convention.
      icon: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    manifest: "/site.webmanifest",
    // Safari on iPhone shows the native "Open in App Store" banner.
    itunes: { appId: APP_STORE_ID },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  const t = getMessages(locale);

  const navLinks = [
    { href: withLocale(locale, "/faq"), label: t.nav.faq },
    { href: withLocale(locale, "/privacy"), label: t.nav.privacy },
    { href: withLocale(locale, "/terms"), label: t.nav.terms },
    { href: withLocale(locale, "/contact"), label: t.nav.contact },
  ] as const;

  const footerLinks = [
    { href: withLocale(locale, "/faq"), label: t.nav.faq },
    { href: withLocale(locale, "/privacy"), label: t.nav.privacy },
    { href: withLocale(locale, "/terms"), label: t.nav.terms },
    {
      href: withLocale(locale, "/delete-account"),
      label: t.nav.deleteAccount,
    },
    { href: withLocale(locale, "/contact"), label: t.nav.contact },
  ] as const;

  return (
    <html lang={locale}>
      <body className={jakarta.variable}>
        <div className="mkt-shell">
          <UtmCapture />
          <header className="mkt-header">
            <div className="mkt-header-inner">
              <Link href={withLocale(locale, "/")} className="mkt-logo">
                <Image
                  src="/kangur-logo.webp"
                  alt=""
                  width={40}
                  height={40}
                  className="mkt-logo-mark"
                  priority
                />
                <span>Kangur</span>
              </Link>

              <MarketingNav links={navLinks} ariaLabel={t.nav.mainAria} />

              <div className="mkt-header-actions">
                <LanguageSwitcher locale={locale} label={t.nav.languageAria} />
                <a
                  className="mkt-btn mkt-btn-nav"
                  href={`${withLocale(locale, "/")}#pobierz`}
                >
                  {t.nav.download}
                </a>
              </div>
            </div>
          </header>

          <div className="mkt-main">{children}</div>

          <footer className="mkt-footer">
            <nav className="mkt-footer-nav" aria-label={t.nav.footerAria}>
              {footerLinks.map((link, index) => (
                <span key={link.href} style={{ display: "contents" }}>
                  {index > 0 ? (
                    <span className="mkt-footer-sep" aria-hidden>
                      ·
                    </span>
                  ) : null}
                  <Link href={link.href}>{link.label}</Link>
                </span>
              ))}
              <span className="mkt-footer-sep" aria-hidden>
                ·
              </span>
              <span className="mkt-footer-copy">
                {t.nav.copyright}. {t.nav.rightsReserved}.
              </span>
            </nav>
            <p className="mkt-footer-entity">
              <LegalEntityLine locale={locale} />
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
