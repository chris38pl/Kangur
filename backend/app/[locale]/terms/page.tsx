import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  APP_LOCALE_IDS,
  isAppLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { TermsContent } from "@/lib/marketing/terms-content";

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
    path: "/terms",
    title: t.meta.termsTitle,
    description: t.meta.termsDescription,
  });
}

export default async function TermsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) notFound();
  return <TermsContent locale={raw as AppLocale} />;
}
