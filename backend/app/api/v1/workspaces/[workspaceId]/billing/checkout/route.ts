import { NextResponse } from "next/server";

import { BillingCheckoutResponseSchema } from "@/features/billing/schemas";
import { createCheckoutSession } from "@/features/billing/createCheckoutSession";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    const result = await createCheckoutSession({
      workspaceId,
      userId: user.id,
    });
    return NextResponse.json(BillingCheckoutResponseSchema.parse(result));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    throw error;
  }
}
