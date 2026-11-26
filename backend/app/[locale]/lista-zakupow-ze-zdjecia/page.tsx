import type { Metadata } from "next";

import { PhotoListPage } from "@/components/pages/topics/PhotoListPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("photoList", "pl");
}

export default function Page() {
  return <PhotoListPage />;
}
