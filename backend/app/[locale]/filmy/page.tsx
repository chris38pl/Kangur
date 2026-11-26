import type { Metadata } from "next";

import { FilmsPage } from "@/components/pages/topics/FilmsPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

// The narrator speaks Polish.
export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("films", "pl");
}

export default function Page() {
  return <FilmsPage />;
}
