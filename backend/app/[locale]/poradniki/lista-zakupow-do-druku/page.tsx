import type { Metadata } from "next";

import { PrintGuidePage } from "@/components/pages/topics/PrintGuidePage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("guidePrint", "pl");
}

export default function Page() {
  return <PrintGuidePage />;
}
