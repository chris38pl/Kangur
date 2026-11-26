import type { Metadata } from "next";

import { AboutPage } from "@/components/pages/AboutPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("about", "pl");
}

export default function Page() {
  return <AboutPage locale="pl" />;
}
