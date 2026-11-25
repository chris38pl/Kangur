import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  isAppLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { FaqContent } from "@/lib/marketing/faq-content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) return {};
  return buildMarketingMetadata("faq", raw);
}

export default async function FaqPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) notFound();
  return <FaqContent locale={raw as AppLocale} />;
}
