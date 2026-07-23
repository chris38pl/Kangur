import { NextResponse } from "next/server";

import {
  deletePlatformWorkspace,
  getPlatformWorkspaceDetail,
} from "@/features/platform/listWorkspaces";
import { PlatformWorkspaceDetailResponseSchema } from "@/features/platform/schemas";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { user } = await requireUser(request);
    const { workspaceId } = await params;
    const result = await getPlatformWorkspaceDetail(user, workspaceId);
    const body = PlatformWorkspaceDetailResponseSchema.parse(result);
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[platform]", "GetWorkspaceFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { user } = await requireUser(request);
    const { workspaceId } = await params;
    await deletePlatformWorkspace(user, workspaceId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[platform]", "DeleteWorkspaceFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
