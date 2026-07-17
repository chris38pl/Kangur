import { NextResponse } from "next/server";

import {
  ApplyAiProposalBodySchema,
  ApplyAiProposalResponseSchema,
} from "@/features/ai/schemas";
import { applyAiProposal } from "@/features/ai/applyAiProposal";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ listId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = ApplyAiProposalBodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const result = await applyAiProposal({
      listId,
      userId: user.id,
      body: parsed.data,
    });

    return NextResponse.json(ApplyAiProposalResponseSchema.parse(result));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[ai]", "ApplyFailed", error);
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "AI apply failed." },
      { status: 400 },
    );
  }
}
