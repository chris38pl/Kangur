import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InvitePage } from "@/components/pages/InvitePage";
import { appInviteBase } from "@/lib/marketing/invite";
import { isAppLocale } from "@/lib/marketing/locale";
import { buildMarketingMetadata } from "@/lib/marketing/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) return {};
  return buildMarketingMetadata("invite", raw);
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  // Read when the page is built: the same app link for every visitor of a deployment.
  const appBase = appInviteBase(process.env.INVITE_ACCEPT_URL_BASE);
  return <InvitePage locale={locale} appBase={appBase} />;
}
