import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  isAppLocale,
  type AppLocale,
} from "@/lib/marketing/locale";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { TermsContent } from "@/lib/marketing/terms-content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) return {};
  return buildMarketingMetadata("terms", raw);
}

export default async function TermsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) notFound();
  return <TermsContent locale={raw as AppLocale} />;
}
