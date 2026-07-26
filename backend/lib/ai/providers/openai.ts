import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";

import {
  AiProviderError,
  classifyProviderFailure,
} from "@/lib/ai/errors";
import type { AiCompletionPort } from "@/lib/ai/port";
import type {
  AiCapability,
  AiInputTurn,
  AiProviderAttemptResult,
  AiStructuredRequest,
} from "@/lib/ai/types";
import { providerSupports } from "@/lib/ai/capabilities";

function mapInputToResponses(input: AiInputTurn[]): ResponseInputItem[] {
  return input.map((turn) => {
    const role =
      turn.role === "system"
        ? "system"
        : turn.role === "assistant"
          ? "assistant"
          : "user";

    const content = turn.parts.map((part) => {
      if (part.type === "text") {
        return { type: "input_text" as const, text: part.text };
      }
      return {
        type: "input_image" as const,
        detail: "auto" as const,
        image_url: `data:${part.mimeType};base64,${part.base64}`,
      };
    });

    return { role, content };
  });
}

function parseStructuredOutput(rawText: string, provider: string): unknown {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new AiProviderError({
      kind: "unavailable",
      message: `${provider} returned an empty structured response.`,
      provider,
    });
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch (cause) {
    throw new AiProviderError({
      kind: "unavailable",
      message: `${provider} returned non-JSON structured output.`,
      provider,
      cause,
    });
  }
}

export function createOpenAiProvider(options: {
  apiKey: string | undefined;
  textModel: string;
  visionModel: string;
}): AiCompletionPort {
  let client: OpenAI | null = null;

  function getClient(): OpenAI {
    if (!options.apiKey) {
      throw new AiProviderError({
        kind: "unavailable",
        message: "Missing OPENAI_API_KEY",
        provider: "openai",
      });
    }
    if (!client) {
      client = new OpenAI({ apiKey: options.apiKey });
    }
    return client;
  }

  return {
    id: "openai",
    supports(capability: AiCapability) {
      return providerSupports("openai", capability);
    },
    isConfigured() {
      return Boolean(options.apiKey);
    },
    async completeStructured(
      req: AiStructuredRequest,
    ): Promise<AiProviderAttemptResult> {
      const model =
        req.modelOverride?.trim() ||
        (req.capability === "vision"
          ? options.visionModel
          : options.textModel);

      try {
        const openai = getClient();
        // Responses API does not accept `seed` (400 unknown_parameter).
        // Eval harness may still pass seed for telemetry / future providers.
        const response = await openai.responses.create({
          model,
          temperature: req.temperature,
          input: mapInputToResponses(req.input),
          text: {
            format: {
              type: "json_schema",
              name: req.outputSchema.name,
              strict: true,
              schema: req.outputSchema.schema,
            },
          },
        });

        const rawText = response.output_text ?? "";
        const structuredOutput = parseStructuredOutput(rawText, "openai");
        const usage = response.usage;

        return {
          provider: "openai",
          model,
          structuredOutput,
          providerResponse: response as unknown,
          usage: {
            promptTokens: usage?.input_tokens,
            completionTokens: usage?.output_tokens,
            totalTokens: usage?.total_tokens,
          },
        };
      } catch (error) {
        if (error instanceof AiProviderError) throw error;
        throw classifyProviderFailure(error, "openai");
      }
    },
  };
}
