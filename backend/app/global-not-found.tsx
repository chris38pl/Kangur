import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";

import { NotFoundMessage } from "@/components/marketing/NotFoundMessage";
import { SITE_DEFAULT_LOCALE } from "@/lib/marketing/locale";
import { notFoundMessages } from "@/lib/marketing/not-found-messages";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

/** Next adds `noindex` to this page itself. */
export const metadata: Metadata = {
  title: `${notFoundMessages[SITE_DEFAULT_LOCALE].title} | Kangur`,
};

export default function GlobalNotFound() {
  return (
    <html lang={SITE_DEFAULT_LOCALE}>
      <body className={jakarta.variable}>
        <div className="mkt-shell">
          <header className="mkt-header">
            <div className="mkt-header-inner">
              {/* Full page loads: this document has no app router layout around it. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className="mkt-logo">
                <Image
                  src="/kangur-logo.webp"
                  alt=""
                  width={40}
                  height={40}
                  className="mkt-logo-mark"
                />
                <span>Kangur</span>
              </a>
            </div>
          </header>
          <div className="mkt-main">
            <section className="mkt-notfound">
              <Image
                src="/kangur-404.webp"
                alt=""
                width={480}
                height={480}
                priority
              />
              <NotFoundMessage />
            </section>
          </div>
        </div>
      </body>
    </html>
  );
}
