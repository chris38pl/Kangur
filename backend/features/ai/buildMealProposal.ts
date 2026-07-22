import { SHOPPING_CATEGORIES } from "@shared/shopping-categories";

import { getOpenAiClient, OPENAI_TEXT_MODEL } from "@/lib/openai";

import type { AiOutputLanguage } from "./outputLanguage";
import { AI_PROMPTS } from "./outputLanguage";
import { MealProposalAiResponseSchema } from "./schemas";

type ExistingItem = {
  id: string;
  name: string;
  amount: string | null;
  note: string | null;
  category: string;
  status: string;
};

const mealProposalJsonSchema = {
  name: "meal_proposal_v1",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      meals: {
        type: "array",
        minItems: 1,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            mealId: { type: "string" },
            title: { type: "string" },
            icon: { type: "string" },
            ingredients: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  proposalRowId: { type: "string" },
                  name: { type: "string" },
                  amount: { type: ["string", "null"] },
                  note: { type: ["string", "null"] },
                  category: {
                    type: "string",
                    enum: [...SHOPPING_CATEGORIES],
                  },
                  confidence: { type: "number" },
                },
                required: [
                  "proposalRowId",
                  "name",
                  "amount",
                  "note",
                  "category",
                  "confidence",
                ],
              },
            },
          },
          required: ["mealId", "title", "icon", "ingredients"],
        },
      },
    },
    required: ["meals"],
  },
  strict: true,
} as const;

function buildPrompt(
  dishes: string[],
  existingItems: ExistingItem[],
  language: AiOutputLanguage,
) {
  const { languageName } = AI_PROMPTS[language];
  return [
    "You turn dish / meal names into supermarket shopping ingredients for a household list.",
    "Return only valid JSON matching the schema. No markdown. No prose.",
    `OUTPUT LANGUAGE (mandatory): ${languageName}. Ingredient names and notes MUST be in this language.`,
    "You may return fewer meals than requested if a dish is ambiguous or unknown (1..5 meals).",
    "Each meal needs: mealId (stable slug), title (short dish name), icon (one emoji), ingredients[].",
    "Ingredients: canonical supermarket product names only.",
    "Product names MUST start with a capital letter (e.g. Makaron spaghetti, not makaron spaghetti).",
    "Prefer common supermarket items; avoid niche specialty products when a common substitute exists.",
    "Examples: Boczek not Guanciale; Ser pecorino not Pecorino Romano DOP; Parmezan not Parmigiano Reggiano DOP.",
    "No premium brands, DOP labels, or pack SKUs (Makaron penne not Penne Rigate Barilla 500 g).",
    "Do NOT include plain water / tap water / cooking water — households already have it.",
    "Exception: include water only when it is a bought product (e.g. sparkling water, soda water, tonic, mineral water for a drink).",
    "amount: ONLY when useful; otherwise null. Do not invent precise pack sizes.",
    "note: optional short shopper hint; prefer null.",
    "Categories must come from the enum exactly; unknown => other.",
    `Requested dishes: ${JSON.stringify(dishes)}`,
    `Existing list items: ${JSON.stringify(existingItems)}`,
  ].join("\n");
}

export async function buildMealProposal(input: {
  dishes: string[];
  existingItems: ExistingItem[];
  outputLanguage: AiOutputLanguage;
  /** Eval harness - optional model override. */
  modelOverride?: string;
  /** Eval reproducibility when the API accepts seed. */
  seed?: number;
}) {
  const openai = getOpenAiClient();
  const model = input.modelOverride?.trim() || OPENAI_TEXT_MODEL;
  const seed = input.seed ?? null;
  const { languageName } = AI_PROMPTS[input.outputLanguage];

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.1,
    ...(seed != null ? { seed } : {}),
    response_format: {
      type: "json_schema",
      json_schema: mealProposalJsonSchema,
    },
    messages: [
      {
        role: "system",
        content: `You are Kangur AI. Produce practical supermarket ingredients for meals. Prefer everyday grocery names. Always output ${languageName}. Return strict JSON only.`,
      },
      {
        role: "user",
        content: buildPrompt(
          input.dishes,
          input.existingItems,
          input.outputLanguage,
        ),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned an empty meal proposal.");

  return {
    model,
    temperature: 0.1,
    seed,
    rawResponse: completion as unknown as Record<string, unknown>,
    ai: MealProposalAiResponseSchema.parse(JSON.parse(raw)),
  };
}
