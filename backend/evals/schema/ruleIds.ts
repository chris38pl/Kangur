export type RuleTier = "hard" | "soft" | "info";
export type RuleSeverity = "critical" | "major" | "minor";

export type RuleDef = {
  id: string;
  type: string;
  tier: RuleTier;
  severity: RuleSeverity;
};

/** Stable rule catalog - use IDs in reports (H003, S002, …). */
export const RULE_CATALOG = {
  H001: {
    id: "H001",
    type: "json_valid",
    tier: "hard",
    severity: "critical",
  },
  H002: {
    id: "H002",
    type: "category_enum",
    tier: "hard",
    severity: "critical",
  },
  H003: {
    id: "H003",
    type: "must_exclude",
    tier: "hard",
    severity: "major",
  },
  H004: {
    id: "H004",
    type: "no_hallucination",
    tier: "hard",
    severity: "critical",
  },
  H005: {
    id: "H005",
    type: "language",
    tier: "hard",
    severity: "major",
  },
  H006: {
    id: "H006",
    type: "product_cap",
    tier: "hard",
    severity: "major",
  },
  H007: {
    id: "H007",
    type: "must_not_merge",
    tier: "hard",
    severity: "major",
  },
  H008: {
    id: "H008",
    type: "must_merge",
    tier: "hard",
    severity: "major",
  },
  H009: {
    id: "H009",
    type: "title_must_not_match",
    tier: "hard",
    severity: "major",
  },
  H010: {
    id: "H010",
    type: "expect_error",
    tier: "hard",
    severity: "critical",
  },
  H011: {
    id: "H011",
    type: "source_list_cap",
    tier: "hard",
    severity: "major",
  },
  H012: {
    id: "H012",
    type: "non_empty_items",
    tier: "hard",
    severity: "major",
  },
  H013: {
    id: "H013",
    type: "no_crash",
    tier: "hard",
    severity: "critical",
  },
  H014: {
    id: "H014",
    type: "unique_item_names",
    tier: "hard",
    severity: "major",
  },
  H015: {
    id: "H015",
    type: "meal_count",
    tier: "hard",
    severity: "major",
  },
  S001: {
    id: "S001",
    type: "must_include_any",
    tier: "soft",
    severity: "major",
  },
  S002: {
    id: "S002",
    type: "golden_similarity",
    tier: "soft",
    severity: "major",
  },
  S003: {
    id: "S003",
    type: "reason_honesty",
    tier: "soft",
    severity: "minor",
  },
  S004: {
    id: "S004",
    type: "title_soft",
    tier: "soft",
    severity: "minor",
  },
  S005: {
    id: "S005",
    type: "prefer_exclude",
    tier: "soft",
    severity: "minor",
  },
  S006: {
    id: "S006",
    type: "min_items",
    tier: "soft",
    severity: "major",
  },
  S007: {
    id: "S007",
    type: "no_premium_terms",
    tier: "soft",
    severity: "major",
  },
  I001: {
    id: "I001",
    type: "merge_count",
    tier: "info",
    severity: "minor",
  },
  I002: {
    id: "I002",
    type: "avg_note_length",
    tier: "info",
    severity: "minor",
  },
  I003: {
    id: "I003",
    type: "avg_reason_length",
    tier: "info",
    severity: "minor",
  },
  I004: {
    id: "I004",
    type: "item_count",
    tier: "info",
    severity: "minor",
  },
} as const satisfies Record<string, RuleDef>;

export type RuleId = keyof typeof RULE_CATALOG;

export function ruleByType(type: string): RuleDef | undefined {
  return Object.values(RULE_CATALOG).find((r) => r.type === type);
}
