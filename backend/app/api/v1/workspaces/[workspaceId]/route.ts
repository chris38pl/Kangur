import { NextResponse } from "next/server";

import { getWorkspace } from "@/features/workspace/getWorkspace";
import {
  UpdateWorkspaceBodySchema,
  WorkspaceDTOSchema,
} from "@/features/workspace/schemas";
import { updateWorkspace } from "@/features/workspace/updateWorkspace";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    const workspace = await getWorkspace(workspaceId, user.id);
    const body = WorkspaceDTOSchema.parse(workspace);
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[workspace]", "GetFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    const json = await request.json();
    const input = UpdateWorkspaceBodySchema.parse(json);
    const workspace = await updateWorkspace({
      workspaceId,
      userId: user.id,
      ...input,
    });
    return NextResponse.json(WorkspaceDTOSchema.parse(workspace));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid request body." },
        { status: 400 },
      );
    }
    console.error("[workspace]", "UpdateFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
