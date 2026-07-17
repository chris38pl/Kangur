import { NextResponse } from "next/server";

import {
  CreateWorkspaceBodySchema,
  WorkspaceDTOSchema,
  WorkspaceListResponseSchema,
} from "@/features/workspace/schemas";
import { createWorkspace } from "@/features/workspace/createWorkspace";
import { listWorkspaces } from "@/features/workspace/listWorkspaces";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request);
    const workspaces = await listWorkspaces(user.id);
    const body = WorkspaceListResponseSchema.parse({ workspaces });
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[workspace]", "ListFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = CreateWorkspaceBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const workspace = await createWorkspace({
      userId: user.id,
      name: parsed.data.name,
      icon: parsed.data.icon,
      userLocale: user.locale,
    });

    const body = WorkspaceDTOSchema.parse(workspace);
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[workspace]", "CreateFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
