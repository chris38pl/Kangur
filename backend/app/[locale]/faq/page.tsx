import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FaqPage } from "@/components/pages/FaqPage";
import { isAppLocale } from "@/lib/marketing/locale";
import { buildMarketingMetadata } from "@/lib/marketing/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) return {};
  return buildMarketingMetadata("faq", raw);
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  return <FaqPage locale={locale} />;
}
