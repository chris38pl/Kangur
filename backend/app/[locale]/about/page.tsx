import type { Metadata } from "next";

import { AboutPage } from "@/components/pages/AboutPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("en");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("about", "en");
}

export default function Page() {
  return <AboutPage locale="en" />;
}
