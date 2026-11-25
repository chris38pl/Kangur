import type { Metadata } from "next";

import { GuidesPage } from "@/components/pages/topics/GuidesPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("guides", "pl");
}

export default function Page() {
  return <GuidesPage />;
}
