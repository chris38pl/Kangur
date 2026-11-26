import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteAccountPage } from "@/components/pages/DeleteAccountPage";
import { isAppLocale } from "@/lib/marketing/locale";
import { buildMarketingMetadata } from "@/lib/marketing/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) return {};
  return buildMarketingMetadata("deleteAccount", raw);
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  return <DeleteAccountPage locale={locale} />;
}
