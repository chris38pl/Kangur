import type { Metadata } from "next";

import { ToolsPage } from "@/components/pages/topics/ToolsPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("tools", "pl");
}

export default function Page() {
  return <ToolsPage />;
}
