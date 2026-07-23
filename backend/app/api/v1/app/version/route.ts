import { NextResponse } from "next/server";

import { getAppVersion } from "@/features/app/getAppVersion";
import { AppVersionResponseSchema } from "@/features/app/schemas";

/** Public — cold-start soft update (and future force) before / without auth. */
export function GET() {
  return NextResponse.json(AppVersionResponseSchema.parse(getAppVersion()));
}
