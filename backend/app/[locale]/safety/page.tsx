import type { Metadata } from "next";

import { SafetyPage } from "@/components/pages/SafetyPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("en");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("safety", "en");
}

export default function Page() {
  return <SafetyPage locale="en" />;
}
