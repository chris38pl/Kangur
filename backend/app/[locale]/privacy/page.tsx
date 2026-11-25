import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  isAppLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { PrivacyContent } from "@/lib/marketing/privacy-content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) return {};
  return buildMarketingMetadata("privacy", raw);
}

export default async function PrivacyPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) notFound();
  return <PrivacyContent locale={raw as AppLocale} />;
}
