import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }

  return cachedClient;
}

export const OPENAI_TEXT_MODEL =
  process.env.OPENAI_MODEL_TEXT?.trim() || "gpt-4.1-mini";

export const OPENAI_VISION_MODEL =
  process.env.OPENAI_MODEL_VISION?.trim() || "gpt-4.1-mini";

export const PROMPT_VERSION = "v3";
