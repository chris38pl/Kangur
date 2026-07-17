import { NextResponse } from "next/server";

import { AiCreditsBalanceSchema } from "@/features/billing/schemas";
import { getAiCreditsBalance } from "@/lib/aiCredits";
import { authorize } from "@/lib/authorize";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    await authorize(workspaceId, user.id);

    const balance = await getAiCreditsBalance(workspaceId);
    return NextResponse.json(AiCreditsBalanceSchema.parse(balance));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    throw error;
  }
}
