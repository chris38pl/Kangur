import { NextResponse } from "next/server";

import { AiIngestResponseSchema } from "@/features/ai/schemas";
import { ingestScreenshot } from "@/features/ai/ingestScreenshot";
import { ingestText } from "@/features/ai/ingestText";
import { assertCanIngest } from "@/lib/aiCredits";
import { authorizeList } from "@/lib/authorize";
import { ApiError, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ listId: string }>;
};

const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request, context: RouteContext) {
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    const { list } = await authorizeList(listId, user.id);

    const formData = await request.formData();
    const source = formData.get("source");

    if (source !== "text" && source !== "clipboard" && source !== "screenshot") {
      throw validationError("Invalid AI ingest source.");
    }

    await assertCanIngest(list.workspaceId, source);

    if (source === "text" || source === "clipboard") {
      const text = formData.get("text");
      if (typeof text !== "string" || !text.trim()) {
        throw validationError("Text input is required.");
      }

      const result = await ingestText({
        listId,
        userId: user.id,
        source,
        text: text.trim(),
      });

      return NextResponse.json(AiIngestResponseSchema.parse(result));
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw validationError("Screenshot file is required.");
    }

    if (!file.type.startsWith("image/")) {
      throw validationError("Screenshot must be an image.");
    }

    if (file.size > MAX_SCREENSHOT_BYTES) {
      throw validationError("Screenshot is too large.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await ingestScreenshot({
      listId,
      userId: user.id,
      fileBuffer: buffer,
      mimeType: file.type,
      fileName: file.name,
    });

    return NextResponse.json(AiIngestResponseSchema.parse(result));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[ai]", "IngestFailed", error);
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "AI ingest failed." },
      { status: 400 },
    );
  }
}
