import Link from "next/link";

import { LanguageLinks } from "@/components/marketing/LanguageSwitcher";
import { LegalEntityLine } from "@/lib/marketing/legal-entity";
import type { AppLocale } from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";
import { footerGroups } from "@/lib/marketing/navigation";
import { PROFILES } from "@/lib/marketing/profiles";

export function SiteFooter({ locale }: { locale: AppLocale }) {
  const t = getMessages(locale).nav;

  return (
    <footer className="mkt-footer">
      <div className="mkt-footer-inner">
        <nav className="mkt-footer-groups" aria-label={t.footerAria}>
          {footerGroups(locale).map((group) => (
            <div key={group.title}>
              <p className="mkt-footer-title">{group.title}</p>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    {/* Thirty links nobody may click are not worth 139 KB of prefetching. */}
                    <Link href={link.href} hrefLang={link.hrefLang} prefetch={false}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="mkt-footer-title">{t.follow}</p>
            <ul>
              {PROFILES.map((profile) => (
                <li key={profile.url}>
                  <a href={profile.url} target="_blank" rel="noopener me">
                    {profile.name} <small>{profile.handle}</small>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="mkt-footer-languages">
            <p className="mkt-footer-title">{t.languages}</p>
            <ul>
              <LanguageLinks locale={locale} home />
            </ul>
          </div>
        </nav>
        <p className="mkt-footer-entity">
          {t.copyright}. {t.rightsReserved}.{" "}
          <LegalEntityLine locale={locale} />
        </p>
      </div>
    </footer>
  );
}
