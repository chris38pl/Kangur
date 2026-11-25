import type { Metadata } from "next";

import { RecipeListPage } from "@/components/pages/topics/RecipeListPage";
import { buildMarketingMetadata } from "@/lib/marketing/seo";
import { onlyIn } from "@/lib/marketing/static-params";

export const generateStaticParams = onlyIn("pl");

export function generateMetadata(): Metadata {
  return buildMarketingMetadata("recipeList", "pl");
}

export default function Page() {
  return <RecipeListPage />;
}
