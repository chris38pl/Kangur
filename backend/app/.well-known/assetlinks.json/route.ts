import { NextResponse } from "next/server";

import { assetLinks } from "@/lib/marketing/appLinks";

export const dynamic = "force-static";

/** Android checks this when the app is installed, to open invitation links in the app. */
export function GET() {
  return NextResponse.json(assetLinks(), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
