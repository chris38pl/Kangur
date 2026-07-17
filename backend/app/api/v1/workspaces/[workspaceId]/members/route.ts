import { NextResponse } from "next/server";

import { listWorkspaceMembers } from "@/features/workspace/listWorkspaceMembers";
import { WorkspaceMemberListResponseSchema } from "@/features/workspace/schemas";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    const members = await listWorkspaceMembers(workspaceId, user.id);
    const body = WorkspaceMemberListResponseSchema.parse({ members });
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[workspace]", "ListMembersFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
