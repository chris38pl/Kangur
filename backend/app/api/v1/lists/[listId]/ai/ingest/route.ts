import { NextResponse } from "next/server";

import { AiIngestResponseSchema } from "@/features/ai/schemas";
import { ingestScreenshot } from "@/features/ai/ingestScreenshot";
import { ingestText } from "@/features/ai/ingestText";
import { assertCanIngest } from "@/lib/aiCredits";
import { authorizeList } from "@/lib/authorize";
import { ApiError, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { assertRateLimit } from "@/lib/rateLimit";

type RouteContext = {
  params: Promise<{ listId: string }>;
};

const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;
const MAX_INGEST_TEXT_CHARS = 8_000;

export async function POST(request: Request, context: RouteContext) {
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    const { list } = await authorizeList(listId, user.id);

    assertRateLimit("ai", `${user.id}:${list.workspaceId}`);

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
      if (text.trim().length > MAX_INGEST_TEXT_CHARS) {
        throw validationError(
          `Text input must be at most ${MAX_INGEST_TEXT_CHARS} characters.`,
        );
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
    if (!(file instanceof Blob)) {
      throw validationError("Screenshot file is required.");
    }

    const mimeFromField = formData.get("mimeType");
    const mimeType =
      (file instanceof File && file.type) ||
      (typeof mimeFromField === "string" && mimeFromField) ||
      "image/jpeg";

    if (!mimeType.startsWith("image/")) {
      throw validationError("Screenshot must be an image.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Light magic-byte sniff — reject obvious non-images even if MIME claims image/*.
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng =
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;
    const isWebp =
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";
    const isGif =
      buffer.length >= 6 &&
      (buffer.toString("ascii", 0, 6) === "GIF87a" ||
        buffer.toString("ascii", 0, 6) === "GIF89a");
    if (!isJpeg && !isPng && !isWebp && !isGif) {
      throw validationError("Screenshot file content is not a supported image.");
    }

    if (file.size > MAX_SCREENSHOT_BYTES) {
      throw validationError("Screenshot is too large.");
    }

    const fileNameField = formData.get("fileName");
    const fileName =
      (file instanceof File && file.name) ||
      (typeof fileNameField === "string" && fileNameField) ||
      "screenshot.jpg";

    const result = await ingestScreenshot({
      listId,
      userId: user.id,
      fileBuffer: buffer,
      mimeType,
      fileName,
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
