import type { Metadata } from "next";

import { ChristmasToolPage } from "@/components/pages/topics/ChristmasToolPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("christmasTool", "pl");
}

export default function Page() {
  return <ChristmasToolPage />;
}
