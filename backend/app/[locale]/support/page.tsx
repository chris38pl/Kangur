import { permanentRedirect } from "next/navigation";

import {
  APP_LOCALE_IDS,
  isAppLocale,
  withLocale,
} from "@/lib/marketing/locale";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return APP_LOCALE_IDS.map((locale) => ({ locale }));
}

export default async function SupportRedirect({ params }: Props) {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) permanentRedirect("/en/contact");
  permanentRedirect(withLocale(raw, "/contact"));
}
