import type { Metadata } from "next";

import { PricingPage } from "@/components/pages/PricingPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("pricing", "pl");
}

export default function Page() {
  return <PricingPage locale="pl" />;
}
