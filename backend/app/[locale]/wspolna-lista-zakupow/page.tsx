import type { Metadata } from "next";

import { SharedListPage } from "@/components/pages/topics/SharedListPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("sharedList", "pl");
}

export default function Page() {
  return <SharedListPage />;
}
