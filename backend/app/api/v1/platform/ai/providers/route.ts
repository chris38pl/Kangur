import { NextResponse } from "next/server";
import { z } from "zod";

import { getAiOrchestrator, getAiProvidersHealth } from "@/lib/ai";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { requirePlatformAdmin } from "@/lib/authorize";

const AiProvidersHealthResponseSchema = z.object({
  chain: z.array(z.enum(["openai", "gemini"])),
  providers: z.array(
    z.object({
      id: z.enum(["openai", "gemini"]),
      configured: z.boolean(),
      inChain: z.boolean(),
      supports: z.array(z.enum(["text", "vision", "structuredJson"])),
      models: z
        .object({
          text: z.string(),
          vision: z.string(),
        })
        .optional(),
    }),
  ),
});

/** Debug / deploy checklist — platform ADMIN only. No live LLM probe. */
export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request);
    requirePlatformAdmin(user);
    const body = AiProvidersHealthResponseSchema.parse(
      getAiProvidersHealth(getAiOrchestrator()),
    );
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[platform]", "AiProvidersHealthFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
