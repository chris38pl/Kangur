import type { Metadata } from "next";

import { WeekGuidePage } from "@/components/pages/topics/WeekGuidePage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("guideWeek", "pl");
}

export default function Page() {
  return <WeekGuidePage />;
}
