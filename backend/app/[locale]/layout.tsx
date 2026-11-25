import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  LanguageList,
  LanguageSwitcher,
} from "@/components/marketing/LanguageSwitcher";
import { MarketingNav, MobileMenu } from "@/components/marketing/MarketingNav";
import { SiteFonts } from "@/components/marketing/SiteFonts";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { UtmCapture } from "@/components/marketing/UtmCapture";
import {
  APP_LOCALE_IDS,
  SITE_DEFAULT_LOCALE,
  isAppLocale,
  withLocale,
} from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";
import { headerLinks } from "@/lib/marketing/navigation";
import { pageMeta } from "@/lib/marketing/page-meta";
import {
  APP_STORE_ID,
  IS_PRODUCTION_SITE,
  SITE_URL,
} from "@/lib/marketing/site";

import "../globals.css";

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
  const t = getMessages(locale).nav;
  const links = headerLinks(locale);
  const home = withLocale(locale, "/");

  return (
    // Anchors glide, page changes do not.
    <html lang={locale} data-scroll-behavior="smooth">
      <body>
        <SiteFonts locale={locale} />
        <div className="mkt-shell">
          <UtmCapture />
          <a className="mkt-skip" href="#tresc">
            {t.skip}
          </a>
          <header className="mkt-header">
            <div className="mkt-header-inner">
              <Link href={home} className="mkt-logo">
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

              <MarketingNav links={links} ariaLabel={t.mainAria} />

              <div className="mkt-header-actions">
                <LanguageSwitcher locale={locale} label={t.languageAria} />
                <a className="mkt-btn mkt-btn-nav" href={`${home}#pobierz`}>
                  {t.download}
                </a>
                <MobileMenu links={links} label={t.menu}>
                  <LanguageList locale={locale} label={t.languageAria} />
                </MobileMenu>
              </div>
            </div>
          </header>

          <main id="tresc" className="mkt-main">
            {children}
          </main>

          <SiteFooter locale={locale} />
        </div>
      </body>
    </html>
  );
}
