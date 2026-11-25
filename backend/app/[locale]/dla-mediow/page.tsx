import type { Metadata } from "next";

import { PressPage } from "@/components/pages/PressPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("press", "pl");
}

export default function Page() {
  return <PressPage locale="pl" />;
}
