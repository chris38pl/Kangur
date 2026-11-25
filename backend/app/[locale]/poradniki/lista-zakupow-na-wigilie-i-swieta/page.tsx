import type { Metadata } from "next";

import { ChristmasGuidePage } from "@/components/pages/topics/ChristmasGuidePage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("guideChristmas", "pl");
}

export default function Page() {
  return <ChristmasGuidePage />;
}
