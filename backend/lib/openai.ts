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

export const AI_PROVIDER = "openai";

/** Import generator (screenshot / clipboard / text) - whole pipeline version. */
export const IMPORT_PROPOSAL_TYPE = "shopping-import";
export const IMPORT_PROPOSAL_VERSION = 4;

/** History suggestions generator - whole pipeline version. */
export const HISTORY_PROPOSAL_TYPE = "shopping-history";
export const HISTORY_PROPOSAL_VERSION = 5;

/** @deprecated Use IMPORT_PROPOSAL_VERSION */
export const PROMPT_VERSION = `v${IMPORT_PROPOSAL_VERSION}`;
