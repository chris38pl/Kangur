import { SHOPPING_CATEGORIES } from "@shared/shopping-categories";

import {
  getOpenAiClient,
  OPENAI_TEXT_MODEL,
  OPENAI_VISION_MODEL,
} from "@/lib/openai";

import type { AiOutputLanguage } from "./outputLanguage";
import { AiProposalSchema } from "./schemas";

type ExistingItem = {
  id: string;
  name: string;
  amount: string | null;
  note: string | null;
  category: string;
  status: string;
};

const proposalJsonSchema = {
  name: "shopping_ai_proposal_v3",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      operations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            proposalRowId: { type: "string" },
            op: {
              type: "string",
              enum: ["create", "merge", "update", "ignore"],
            },
            targetItemId: { type: ["string", "null"] },
            clientId: { type: ["string", "null"] },
            name: { type: "string" },
            amount: { type: ["string", "null"] },
            note: { type: ["string", "null"] },
            category: { type: "string", enum: [...SHOPPING_CATEGORIES] },
            confidence: { type: "number" },
            reason: { type: ["string", "null"] },
          },
          required: [
            "proposalRowId",
            "op",
            "targetItemId",
            "clientId",
            "name",
            "amount",
            "note",
            "category",
            "confidence",
            "reason",
          ],
        },
      },
    },
    required: ["operations"],
  },
  strict: true,
} as const;

function languageBlock(language: AiOutputLanguage): string {
  if (language === "pl") {
    return [
      "OUTPUT LANGUAGE (mandatory, non-negotiable): Polish (pl-PL).",
      "Every `name`, `note`, and `reason` MUST be written in Polish.",
      "Use Polish canonical product names: Mleko, Ser, Chleb, Jabłka, Kawa, Jogurt, Masło, Jajka — NEVER English Milk/Cheese/Bread/Apples/Coffee.",
      "If the source text/image is Polish, KEEP Polish — do not translate to English.",
      "If the source is English (or mixed), TRANSLATE product names into Polish.",
      "Amount: keep digits; use Polish unit wording when present (np. \"2 szt.\", \"500 g\", \"1 l\").",
      "Examples: \"Kup mleko\" → name Mleko. \"Kup 2 cytryny\" → Cytryna / amount \"2\". \"Kup mleko bez laktozy\" → Mleko / note bez laktozy. \"Buy milk\" → Mleko.",
    ].join("\n");
  }

  return [
    "OUTPUT LANGUAGE (mandatory, non-negotiable): English (en).",
    "Every `name`, `note`, and `reason` MUST be written in English.",
    "Use English canonical product names: Milk, Cheese, Bread, Apples, Coffee.",
    "If the source is another language, TRANSLATE product names into English.",
    "Examples: \"Buy milk\" → Milk. \"Buy 2 lemons\" → Lemon / \"2\". \"Buy lactose free milk\" → Milk / note lactose free.",
  ].join("\n");
}

function buildPrompt(
  sourceLabel: string,
  rawInput: string,
  items: ExistingItem[],
  language: AiOutputLanguage,
) {
  return [
    "You convert shopping inputs into reviewable operations for a household shopping list.",
    "Return only valid JSON matching the schema.",
    languageBlock(language),
    "Extraction priority: 1) canonical product name, 2) optional amount, 3) optional note.",
    "name = canonical product only. Do NOT put descriptors in name.",
    "amount = human-readable quantity string ONLY when the source explicitly states one. NEVER invent amount. If none is stated, set amount to null.",
    "note = optional shopper hint (variant, brand, flavour). Put brand/variant/flavour/fat% in note, never as separate fields.",
    "Categories must come from the enum exactly; unknown category => other.",
    "Prefer merge when the input clearly matches an existing active item (match by meaning even across languages; keep the existing item's name on merge when possible).",
    "Use update when the input changes an existing item materially.",
    "Use create for new items.",
    "Use ignore only for noise or unreadable fragments.",
    "confidence is 0..1.",
    `Existing items: ${JSON.stringify(items)}`,
    `Source: ${sourceLabel}`,
    `Input: ${rawInput}`,
  ].join("\n");
}

function systemMessage(language: AiOutputLanguage, kind: "text" | "vision") {
  const lang =
    language === "pl"
      ? "Always output Polish product names (never English)."
      : "Always output English product names.";
  if (kind === "vision") {
    return `You are Kangur AI. Read shopping list screenshots. Prefer simple name + optional amount + optional note. Never invent amounts. ${lang} If the screenshot contains Polish text, product names MUST be Polish even if brand names are foreign.`;
  }
  return `You are Kangur AI. Extract shopping intent for everyday grocery lists. Prefer simple name + optional amount + optional note. Never invent amounts. ${lang}`;
}

export async function buildProposalFromText(input: {
  sourceLabel: "text" | "clipboard";
  rawInput: string;
  existingItems: ExistingItem[];
  outputLanguage: AiOutputLanguage;
}) {
  const openai = getOpenAiClient();
  const model = OPENAI_TEXT_MODEL;
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: proposalJsonSchema,
    },
    messages: [
      {
        role: "system",
        content: systemMessage(input.outputLanguage, "text"),
      },
      {
        role: "user",
        content: buildPrompt(
          input.sourceLabel,
          input.rawInput,
          input.existingItems,
          input.outputLanguage,
        ),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty proposal.");
  }

  return {
    model,
    rawResponse: completion as unknown as Record<string, unknown>,
    proposal: AiProposalSchema.parse(JSON.parse(raw)),
  };
}

export async function buildProposalFromScreenshot(input: {
  rawHint: string;
  mimeType: string;
  base64: string;
  existingItems: ExistingItem[];
  outputLanguage: AiOutputLanguage;
}) {
  const openai = getOpenAiClient();
  const model = OPENAI_VISION_MODEL;
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: proposalJsonSchema,
    },
    messages: [
      {
        role: "system",
        content: systemMessage(input.outputLanguage, "vision"),
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildPrompt(
              "screenshot",
              input.rawHint,
              input.existingItems,
              input.outputLanguage,
            ),
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${input.mimeType};base64,${input.base64}`,
            },
          },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty proposal.");
  }

  return {
    model,
    rawResponse: completion as unknown as Record<string, unknown>,
    proposal: AiProposalSchema.parse(JSON.parse(raw)),
  };
}
