import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  APP_LOCALE_IDS,
  isAppLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";
import { FaqContent } from "@/lib/marketing/faq-content";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return APP_LOCALE_IDS.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) return {};
  const t = getMessages(raw);
  return {
    title: { absolute: t.meta.faqTitle },
    description: t.meta.faqDescription,
    openGraph: {
      title: t.meta.faqTitle,
      description: t.meta.faqDescription,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Kangur" }],
    },
  };
}

export default async function FaqPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) notFound();
  return <FaqContent locale={raw as AppLocale} />;
}
