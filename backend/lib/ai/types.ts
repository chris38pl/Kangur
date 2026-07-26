/** Provider-agnostic AI completion types (no OpenAI / Gemini SDK leaks). */

export type AiCapability = "text" | "vision" | "structuredJson";

export type AiProviderId = "openai" | "gemini";

export type AiFeature =
  | "import-text"
  | "import-vision"
  | "meal"
  | "history";

export type AiInputPart =
  | { type: "text"; text: string }
  | { type: "image"; mimeType: string; base64: string };

export type AiInputTurn = {
  role: "system" | "user" | "assistant";
  parts: AiInputPart[];
};

export type AiStructuredRequest = {
  capability: "text" | "vision";
  input: AiInputTurn[];
  outputSchema: { name: string; schema: Record<string, unknown> };
  temperature?: number;
  seed?: number;
  modelOverride?: string;
  meta: {
    feature: AiFeature;
    requestId?: string;
  };
};

export type AiTokenUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type AiProviderAttemptResult = {
  provider: string;
  model: string;
  structuredOutput: unknown;
  providerResponse: unknown;
  usage: AiTokenUsage;
};

export type AiStructuredResult = AiProviderAttemptResult & {
  timing: {
    attempts: number;
    usedFallback: boolean;
    fallbackProvider?: string;
    primaryProvider: string;
    fallbackReason?: string;
    providerAttemptOrder: string[];
    providersTried: string[];
    durationMs: number;
  };
};
