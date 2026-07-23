import { NextResponse } from "next/server";

import { listPlatformWorkspaces } from "@/features/platform/listWorkspaces";
import {
  PlatformWorkspaceListResponseSchema,
  PlatformWorkspacePlanFilterSchema,
} from "@/features/platform/schemas";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request);
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? undefined;
    const planRaw = url.searchParams.get("plan") ?? "all";
    const plan = PlatformWorkspacePlanFilterSchema.parse(planRaw);
    const cursor = url.searchParams.get("cursor") ?? undefined;

    const result = await listPlatformWorkspaces(user, { q, plan, cursor });
    const body = PlatformWorkspaceListResponseSchema.parse(result);
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid query." },
        { status: 400 },
      );
    }

    console.error("[platform]", "ListWorkspacesFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
