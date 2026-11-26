import type { Metadata } from "next";

import { WeekToolPage } from "@/components/pages/topics/WeekToolPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("weekTool", "pl");
}

export default function Page() {
  return <WeekToolPage />;
}
