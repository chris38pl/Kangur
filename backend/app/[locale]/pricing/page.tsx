import type { Metadata } from "next";

import { PricingPage } from "@/components/pages/PricingPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("en");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("pricing", "en");
}

export default function Page() {
  return <PricingPage locale="en" />;
}
