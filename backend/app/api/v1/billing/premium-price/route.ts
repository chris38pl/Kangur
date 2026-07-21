import { NextResponse } from "next/server";

import { getPremiumPrice } from "@/features/billing/getPremiumPrice";
import { PremiumPriceSchema } from "@/features/billing/schemas";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const price = await getPremiumPrice();
    return NextResponse.json(PremiumPriceSchema.parse(price));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    throw error;
  }
}
