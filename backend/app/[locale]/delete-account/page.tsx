import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  APP_LOCALE_IDS,
  isAppLocale,
  withLocale,
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
    title: { absolute: t.meta.deleteTitle },
    description: t.meta.deleteDescription,
    openGraph: {
      title: t.meta.deleteTitle,
      description: t.meta.deleteDescription,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Kangur" }],
    },
  };
}

export default async function DeleteAccountPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) notFound();
  const locale = raw as AppLocale;
  const t = getMessages(locale);
  const contactHref = withLocale(locale, "/contact");
  const privacyHref = withLocale(locale, "/privacy");
  const termsHref = withLocale(locale, "/terms");
  const d = t.deleteAccount;

  return (
    <article className="mkt-legal">
      <h1>{d.title}</h1>
      <p className="mkt-meta">{d.meta}</p>
      <p>{d.intro}</p>

      <h2>{d.howHeading}</h2>
      <p className="mkt-delete-path">{d.howPath}</p>
      <p>{d.howConfirm}</p>

      <h2>{d.effectsHeading}</h2>
      <p>{d.effectsBody}</p>

      <h2>{d.removeHeading}</h2>
      <ul>
        {d.removeItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>{d.keepHeading}</h2>
      <ul>
        {d.keepItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>{d.accessHeading}</h2>
      <p>
        {locale === "pl" ? (
          <>
            Jeżeli nie masz dostępu do swojego konta i nie możesz usunąć go z
            poziomu aplikacji, skontaktuj się z nami pod adresem{" "}
            <a href="mailto:support@getkangur.com">support@getkangur.com</a>.
          </>
        ) : (
          <>
            If you no longer have access to your account and cannot delete it in
            the app, contact us at{" "}
            <a href="mailto:support@getkangur.com">support@getkangur.com</a>.
          </>
        )}
      </p>

      <p>
        {d.morePrivacy} <Link href={privacyHref}>{t.nav.privacy}</Link>.{" "}
        <Link href={termsHref}>{t.nav.terms}</Link>
        {" · "}
        <Link href={contactHref}>{t.nav.contact}</Link>.
      </p>
    </article>
  );
}
