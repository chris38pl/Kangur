import { NextResponse } from "next/server";

import { createCustomerPortalSession } from "@/features/billing/createCustomerPortalSession";
import { BillingPortalResponseSchema } from "@/features/billing/schemas";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    const result = await createCustomerPortalSession({
      workspaceId,
      userId: user.id,
    });
    return NextResponse.json(BillingPortalResponseSchema.parse(result));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    throw error;
  }
}
