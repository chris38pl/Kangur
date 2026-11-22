import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  APP_LOCALE_IDS,
  isAppLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { FaqContent } from "@/lib/marketing/faq-content";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return APP_LOCALE_IDS.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) return {};
  const t = getMessages(raw);
  return buildMarketingMetadata({
    locale: raw,
    path: "/faq",
    title: t.meta.faqTitle,
    description: t.meta.faqDescription,
  });
}

export default async function FaqPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) notFound();
  return <FaqContent locale={raw as AppLocale} />;
}
