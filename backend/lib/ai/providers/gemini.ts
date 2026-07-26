import {
  AiProviderError,
  classifyProviderFailure,
} from "@/lib/ai/errors";
import { providerSupports } from "@/lib/ai/capabilities";
import type { AiCompletionPort } from "@/lib/ai/port";
import type {
  AiCapability,
  AiInputTurn,
  AiProviderAttemptResult,
  AiStructuredRequest,
} from "@/lib/ai/types";

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

function mapInputToGemini(input: AiInputTurn[]): {
  systemInstruction?: string;
  contents: GeminiContent[];
} {
  const systemParts: string[] = [];
  const contents: GeminiContent[] = [];

  for (const turn of input) {
    if (turn.role === "system") {
      for (const part of turn.parts) {
        if (part.type === "text") systemParts.push(part.text);
      }
      continue;
    }

    const role = turn.role === "assistant" ? "model" : "user";
    const parts: GeminiPart[] = turn.parts.map((part) => {
      if (part.type === "text") return { text: part.text };
      return {
        inlineData: { mimeType: part.mimeType, data: part.base64 },
      };
    });
    contents.push({ role, parts });
  }

  return {
    systemInstruction:
      systemParts.length > 0 ? systemParts.join("\n") : undefined,
    contents,
  };
}

/**
 * Gemini REST generateContent — no SDK dependency until Etap 2 keys land.
 * Uses responseMimeType=application/json + responseSchema when possible.
 */
export function createGeminiProvider(options: {
  apiKey: string | undefined;
  textModel: string;
  visionModel: string;
}): AiCompletionPort {
  return {
    id: "gemini",
    supports(capability: AiCapability) {
      return providerSupports("gemini", capability);
    },
    isConfigured() {
      return Boolean(options.apiKey);
    },
    async completeStructured(
      req: AiStructuredRequest,
    ): Promise<AiProviderAttemptResult> {
      if (!options.apiKey) {
        throw new AiProviderError({
          kind: "unavailable",
          message: "Missing GEMINI_API_KEY",
          provider: "gemini",
        });
      }

      const model =
        req.modelOverride?.trim() ||
        (req.capability === "vision"
          ? options.visionModel
          : options.textModel);

      const { systemInstruction, contents } = mapInputToGemini(req.input);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(options.apiKey)}`;

      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: req.temperature ?? 0.2,
          responseMimeType: "application/json",
          responseSchema: req.outputSchema.schema,
        },
      };
      if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const json = (await response.json()) as {
          error?: { message?: string; code?: number; status?: string };
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
            finishReason?: string;
          }>;
          usageMetadata?: {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
            totalTokenCount?: number;
          };
        };

        if (!response.ok) {
          const message =
            json.error?.message ||
            `Gemini HTTP ${response.status}`;
          throw classifyProviderFailure(
            Object.assign(new Error(message), { status: response.status }),
            "gemini",
          );
        }

        const finishReason = json.candidates?.[0]?.finishReason;
        if (finishReason === "SAFETY" || finishReason === "BLOCKLIST") {
          throw new AiProviderError({
            kind: "content",
            message: `Gemini blocked the response (${finishReason}).`,
            provider: "gemini",
          });
        }

        const rawText =
          json.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join("")
            .trim() ?? "";

        if (!rawText) {
          throw new AiProviderError({
            kind: "unavailable",
            message: "Gemini returned an empty structured response.",
            provider: "gemini",
          });
        }

        let structuredOutput: unknown;
        try {
          structuredOutput = JSON.parse(rawText) as unknown;
        } catch (cause) {
          throw new AiProviderError({
            kind: "unavailable",
            message: "Gemini returned non-JSON structured output.",
            provider: "gemini",
            cause,
          });
        }

        const usage = json.usageMetadata;
        return {
          provider: "gemini",
          model,
          structuredOutput,
          providerResponse: json,
          usage: {
            promptTokens: usage?.promptTokenCount,
            completionTokens: usage?.candidatesTokenCount,
            totalTokens: usage?.totalTokenCount,
          },
        };
      } catch (error) {
        if (error instanceof AiProviderError) throw error;
        throw classifyProviderFailure(error, "gemini");
      }
    },
  };
}
