import type { Metadata } from "next";

import { AisleToolPage } from "@/components/pages/topics/AisleToolPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("aisleTool", "pl");
}

export default function Page() {
  return <AisleToolPage />;
}
