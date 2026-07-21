import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  APP_LOCALE_IDS,
  isAppLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";
import { PrivacyContent } from "@/lib/marketing/privacy-content";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return APP_LOCALE_IDS.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) return {};
  const t = getMessages(raw);
  return {
    title: { absolute: t.meta.privacyTitle },
    description: t.meta.privacyDescription,
    openGraph: {
      title: t.meta.privacyTitle,
      description: t.meta.privacyDescription,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Kangur" }],
    },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) notFound();
  return <PrivacyContent locale={raw as AppLocale} />;
}
