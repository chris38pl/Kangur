import { NextResponse } from "next/server";
import { z } from "zod";

import {
  VerifyPurchaseBodySchema,
  verifyAndApplyPurchase,
} from "@/features/billing/verifyAndApplyPurchase";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    const json = await request.json().catch(() => null);
    const body = VerifyPurchaseBodySchema.parse(json);

    const result = await verifyAndApplyPurchase({
      workspaceId,
      userId: user.id,
      provider: body.provider,
      productId: body.productId,
      proof: body.proof,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid verify body.", details: error.flatten() },
        { status: 400 },
      );
    }
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[billing] verify error", error);
    return NextResponse.json(
      { error: "Verify purchase failed." },
      { status: 400 },
    );
  }
}
