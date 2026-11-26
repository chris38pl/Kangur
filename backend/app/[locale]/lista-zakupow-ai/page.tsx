import type { Metadata } from "next";

import { AiListPage } from "@/components/pages/topics/AiListPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("aiList", "pl");
}

export default function Page() {
  return <AiListPage />;
}
