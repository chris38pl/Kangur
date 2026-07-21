import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import {
  APP_LOCALE_IDS,
  isAppLocale,
  withLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";

export function generateStaticParams() {
  return APP_LOCALE_IDS.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) notFound();
  const locale = raw as AppLocale;
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
    <div className="mkt-shell">
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
              href={withLocale(locale, "/#pobierz")}
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
      </footer>
    </div>
  );
}
