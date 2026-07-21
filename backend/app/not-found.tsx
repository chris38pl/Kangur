import Image from "next/image";
import Link from "next/link";

import { DEFAULT_LOCALE, withLocale } from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";

export default function NotFound() {
  const t = getMessages(DEFAULT_LOCALE);
  const home = withLocale(DEFAULT_LOCALE, "/");

  return (
    <div className="mkt-shell">
      <div className="mkt-main">
        <section className="mkt-notfound">
          <Image
            src="/kangur-404.webp"
            alt=""
            width={480}
            height={480}
            priority
          />
          <h1>{t.notFound.title}</h1>
          <p>{t.notFound.body}</p>
          <Link className="mkt-btn mkt-btn-primary" href={home}>
            {t.notFound.back}
          </Link>
        </section>
      </div>
      <footer className="mkt-footer">
        <nav className="mkt-footer-nav" aria-label={t.nav.footerAria}>
          <span className="mkt-footer-copy">
            {t.nav.copyright}. {t.nav.rightsReserved}.
          </span>
        </nav>
      </footer>
    </div>
  );
}
