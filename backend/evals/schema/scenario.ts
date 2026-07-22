import { z } from "zod";

const RuleRefSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  severity: z.enum(["critical", "major", "minor"]).optional(),
  weight: z.number().optional(),
  names: z.array(z.string()).optional(),
  pairs: z
    .array(z.object({ a: z.string(), b: z.string() }))
    .optional(),
  groups: z.array(z.array(z.string())).optional(),
  locale: z.string().optional(),
  max: z.number().optional(),
  min: z.number().optional(),
  patterns: z.array(z.string()).optional(),
  code: z.string().optional(),
  minRecall: z.number().optional(),
  minPrecision: z.number().optional(),
  minF1: z.number().optional(),
  expected: z.number().optional(),
});

const HistoryItemSchema = z.object({
  name: z.string(),
  amount: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  category: z.string().default("other"),
});

const HistoryListSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  updatedAt: z.string(),
  preferredForAi: z.boolean().optional().default(false),
  items: z.array(HistoryItemSchema),
});

/** Stress fixtures without listing thousands of YAML lines. */
const GenerateSchema = z.object({
  listCount: z.number().int().positive(),
  itemsPerList: z.number().int().nonnegative(),
  namePrefix: z.string().default("Produkt"),
  baseDate: z.string().default("2026-07-01T10:00:00.000Z"),
  listNamePrefix: z.string().default("Lista"),
  category: z.string().default("other"),
});

export const ScenarioInputSchema = z.object({
  locale: z.string().default("pl"),
  lists: z.array(HistoryListSchema).optional(),
  generate: GenerateSchema.optional(),
  /** Meal proposal: dish / recipe names (1–5). */
  dishes: z.array(z.string().trim().min(1).max(80)).min(1).max(5).optional(),
  /** Meal proposal: existing list items for merge checks. */
  existingItems: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        amount: z.string().nullable().optional(),
        note: z.string().nullable().optional(),
        category: z.string().default("other"),
        status: z.string().default("pending"),
      }),
    )
    .optional(),
  /**
   * Meal proposal offline path: AI-shaped meals fixture → only
   * `dedupeMealIngredients` (no OpenAI).
   */
  mealsFixture: z
    .object({
      meals: z
        .array(
          z.object({
            mealId: z.string().min(1),
            title: z.string().min(1),
            icon: z.string().min(1),
            ingredients: z
              .array(
                z.object({
                  proposalRowId: z.string(),
                  name: z.string().min(1),
                  amount: z.string().nullable().optional(),
                  note: z.string().nullable().optional(),
                  category: z.string(),
                  confidence: z.number().optional(),
                }),
              )
              .min(1),
          }),
        )
        .min(1)
        .max(5),
    })
    .optional(),
});

export const BaselineSchema = z.object({
  items: z.array(z.string()).optional(),
  outputRef: z.string().optional(),
  titleMustMatch: z.string().optional(),
});

export const ScenarioSchema = z.object({
  id: z.string().min(1),
  scenarioVersion: z.number().int().positive().default(1),
  name: z.string().min(1),
  description: z.string().optional(),
  adapter: z.string().min(1),
  input: ScenarioInputSchema,
  baseline: BaselineSchema.optional(),
  expectations: z
    .object({
      mustIncludeAny: z.array(z.string()).optional(),
      mustExclude: z.array(z.string()).optional(),
      preferExclude: z.array(z.string()).optional(),
      titleMustNotMatch: z.array(z.string()).optional(),
      titleMustMatch: z.array(z.string()).optional(),
      expectError: z.string().optional(),
      sourceListCap: z.number().int().optional(),
      nonEmpty: z.boolean().optional(),
      minItems: z.number().int().positive().optional(),
    })
    .optional(),
  hardRules: z.array(RuleRefSchema).default([]),
  softRules: z.array(RuleRefSchema).default([]),
  infoRules: z.array(RuleRefSchema).default([]),
  metrics: z
    .object({
      track: z.array(z.string()).optional(),
    })
    .optional(),
});

export type Scenario = z.infer<typeof ScenarioSchema>;
export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;
export type RuleRef = z.infer<typeof RuleRefSchema>;
