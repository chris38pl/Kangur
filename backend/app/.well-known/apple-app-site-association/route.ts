import { NextResponse } from "next/server";

import { appleAppSiteAssociation } from "@/lib/marketing/appLinks";

export const dynamic = "force-static";

/** iOS reads this through Apple's CDN when the app is installed: JSON, no redirect. */
export function GET() {
  return NextResponse.json(appleAppSiteAssociation(), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
