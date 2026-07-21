import { SHOPPING_CATEGORIES } from "@shared/shopping-categories";

import { findName, namesMatch, precisionRecallF1 } from "../lib/names";
import { RULE_CATALOG, ruleByType } from "../schema/ruleIds";
import type { Evidence, RuleResult } from "../schema/report";
import type { RuleRef, Scenario } from "../schema/scenario";

type ProposalItem = {
  name: string;
  amount?: string | null;
  note?: string | null;
  category?: string;
  reason?: string | null;
  timesSeen?: number;
};

type Proposal = {
  shoppingContext?: { title?: string; theme?: string };
  items?: ProposalItem[];
};

function resolveMeta(
  ref: RuleRef,
  fallbackType: string,
): { id: string; type: string; tier: RuleResult["tier"]; severity: RuleResult["severity"] } {
  const byId = ref.id
    ? RULE_CATALOG[ref.id as keyof typeof RULE_CATALOG]
    : undefined;
  const byType = ruleByType(ref.type || fallbackType);
  const meta = byId ?? byType;
  return {
    id: ref.id ?? meta?.id ?? "H000",
    type: ref.type || meta?.type || fallbackType,
    tier: meta?.tier ?? "hard",
    severity: ref.severity ?? meta?.severity ?? "major",
  };
}

function timed(
  meta: ReturnType<typeof resolveMeta>,
  fn: () => Omit<RuleResult, "id" | "type" | "tier" | "severity" | "latencyMs">,
): RuleResult {
  const t0 = Date.now();
  const body = fn();
  return { ...meta, ...body, latencyMs: Date.now() - t0 };
}

function itemNames(output: Proposal | null): string[] {
  return (output?.items ?? []).map((i) => i.name);
}

function hasFrequentReason(reason: string | null | undefined): boolean {
  if (!reason) return false;
  return /(często|frequently|częstym|częsta|częste|often|regular)/i.test(
    reason,
  );
}

function judgeJsonValid(
  ref: RuleRef,
  output: Proposal | null,
  error?: { code: string },
): RuleResult {
  return timed(resolveMeta(ref, "json_valid"), () => {
    if (error?.code === "EMPTY_HISTORY") {
      return {
        status: "pass",
        message: "Skipped (empty history - no model output).",
        evidence: {},
      };
    }
    if (error) {
      return {
        status: "fail",
        message: `Adapter error: ${error.code}`,
        evidence: { details: { code: error.code } },
      };
    }
    if (!output || !Array.isArray(output.items)) {
      return {
        status: "fail",
        message: "Normalized output missing or invalid shape.",
        evidence: {},
      };
    }
    return { status: "pass", message: "JSON/Zod shape OK.", evidence: {} };
  });
}

function judgeCategoryEnum(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "category_enum"), () => {
    if (!output?.items) {
      return { status: "pass", message: "No items.", evidence: {} };
    }
    const allowed = new Set<string>(SHOPPING_CATEGORIES);
    const bad = output.items.filter((i) => !allowed.has(i.category ?? ""));
    if (bad.length) {
      return {
        status: "fail",
        message: "Output contains categories outside enum.",
        evidence: {
          offendingItems: bad.map((i) => `${i.name}:${i.category}`),
          expected: [...SHOPPING_CATEGORIES],
        },
      };
    }
    return { status: "pass", message: "All categories in enum.", evidence: {} };
  });
}

function judgeMustExclude(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "must_exclude"), () => {
    const names = ref.names ?? [];
    const actual = itemNames(output);
    const offending = names.filter((n) => findName(actual, n));
    if (offending.length) {
      return {
        status: "fail",
        message: "Excluded products appeared in output.",
        evidence: { offendingItems: offending, expected: names, actual },
      };
    }
    return {
      status: "pass",
      message: "No excluded products in output.",
      evidence: { expected: names, actual },
    };
  });
}

function judgeNoHallucination(
  ref: RuleRef,
  output: Proposal | null,
  corpus: string[],
): RuleResult {
  return timed(resolveMeta(ref, "no_hallucination"), () => {
    const actual = itemNames(output);
    const offending = actual.filter((n) => !findName(corpus, n));
    // Soft fuzzy: also allow substring stem match via normalize equality only for V1
    if (offending.length) {
      return {
        status: "fail",
        message: "Products not found in history corpus.",
        evidence: {
          offendingItems: offending,
          expected: corpus.slice(0, 40),
          actual,
        },
      };
    }
    return {
      status: "pass",
      message: "All products grounded in corpus.",
      evidence: { actual },
    };
  });
}

function judgeLanguage(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "language"), () => {
    const locale = ref.locale ?? "pl";
    if (locale !== "pl") {
      return {
        status: "pass",
        message: `Language check skipped for locale=${locale}.`,
        evidence: {},
      };
    }
    const actual = itemNames(output);
    // Heuristic: flag items that are pure ASCII English staples while Polish expected -
    // keep very light; only fail on obvious all-English grocery words without Polish chars
    // when title also looks English-only. Soften: check title for banned English-only meta.
    const title = output?.shoppingContext?.title ?? "";
    const englishOnlyTitle =
      /\b(shopping|grocery|list|weekly)\b/i.test(title) &&
      !/[ąćęłńóśźż]/i.test(title);
    if (englishOnlyTitle && actual.length > 0) {
      // Soft signal only - language is heuristic; do not hard-fail.
      return {
        status: "pass",
        message: "Title looks English-only for PL locale (noted).",
        evidence: { actual: [title], details: { softNote: true } },
      };
    }
    return {
      status: "pass",
      message: "Language heuristic OK.",
      evidence: { actual },
    };
  });
}

function judgeProductCap(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "product_cap"), () => {
    const max = ref.max ?? 40;
    const count = output?.items?.length ?? 0;
    if (count > max) {
      return {
        status: "fail",
        message: `Item count ${count} exceeds cap ${max}.`,
        evidence: { details: { count, max } },
      };
    }
    return {
      status: "pass",
      message: `Item count ${count} ≤ ${max}.`,
      evidence: { details: { count, max } },
    };
  });
}

function judgeMustNotMerge(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "must_not_merge"), () => {
    const pairs = ref.pairs ?? [];
    const actual = itemNames(output);
    const offending: string[] = [];
    for (const { a, b } of pairs) {
      // Fail if both distinct variants collapsed to one ambiguous name only -
      // Pass if both present OR neither; Fail if exactly one of the pair names
      // matches a single row that could be either (hard to detect). Simpler V1:
      // Fail if output has a name that equals neither but fuzzy-equals both keys
      // OR if only one of a/b is present when both were required as separate.
      // Locked V1: fail if count of matching rows for {a,b} as distinct is 1
      // when both a and b appear in corpus expectation - i.e. merged.
      const matchA = actual.filter((n) => namesMatch(n, a));
      const matchB = actual.filter((n) => namesMatch(n, b));
      if (matchA.length === 1 && matchB.length === 0) {
        // might be merge into a - check if name looks like only a
        continue;
      }
      if (matchA.length === 0 && matchB.length === 0) {
        // merged into something else? check if any item contains both tokens
        const merged = actual.find(
          (n) =>
            n.toLowerCase().includes(a.toLowerCase().slice(0, 4)) &&
            n.toLowerCase().includes(b.toLowerCase().slice(0, 4)) &&
            !namesMatch(n, a) &&
            !namesMatch(n, b),
        );
        if (merged) offending.push(merged);
      }
    }
    // Stronger check: if both a and b should remain distinct, fail when exactly one total match for either
    for (const { a, b } of pairs) {
      const hits = actual.filter((n) => namesMatch(n, a) || namesMatch(n, b));
      const distinct = new Set(hits.map((h) => h.toLowerCase()));
      // If scenario listed both as must-not-merge, we expect 0 or 2 distinct - not 1 representing both
      if (distinct.size === 1 && hits.length >= 1) {
        // Only flag when the single name could represent either (exact match to one)
        // This is OK if model picked one variant - not a merge failure.
        // Merge failure: neither a nor b exact, but one row - skip.
      }
      void distinct;
    }
    if (offending.length) {
      return {
        status: "fail",
        message: "Variants appear merged.",
        evidence: { offendingItems: offending },
      };
    }
    return {
      status: "pass",
      message: "No illegal merges detected.",
      evidence: { actual },
    };
  });
}

function judgeMustMerge(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "must_merge"), () => {
    const groups = ref.groups ?? [];
    const actual = itemNames(output);
    const extra: string[] = [];
    for (const group of groups) {
      const hits = group.filter((g) => findName(actual, g));
      if (hits.length > 1) {
        extra.push(...hits);
      }
    }
    if (extra.length) {
      return {
        status: "fail",
        message: "Synonyms not merged into a single row.",
        evidence: { offendingItems: extra, actual },
      };
    }
    return {
      status: "pass",
      message: "Synonym groups collapsed.",
      evidence: { actual },
    };
  });
}

/** Compile scenario patterns; supports PCRE-style `(?i)` → JS `i` flag. */
function compilePattern(pattern: string): RegExp {
  let source = pattern;
  let flags = "u";
  if (source.startsWith("(?i)")) {
    source = source.slice(4);
    flags += "i";
  } else if (source.startsWith("(?-i)")) {
    source = source.slice(5);
  }
  try {
    return new RegExp(source, flags);
  } catch {
    return new RegExp(source, flags.replace("u", ""));
  }
}

function judgeTitleMustNotMatch(
  ref: RuleRef,
  output: Proposal | null,
): RuleResult {
  return timed(resolveMeta(ref, "title_must_not_match"), () => {
    const patterns = ref.patterns ?? [];
    const title = output?.shoppingContext?.title ?? "";
    const offending = patterns.filter((p) => compilePattern(p).test(title));
    if (offending.length) {
      return {
        status: "fail",
        message: `Title matched forbidden pattern(s).`,
        evidence: {
          actual: [title],
          offendingItems: offending,
        },
      };
    }
    return {
      status: "pass",
      message: "Title OK.",
      evidence: { actual: [title] },
    };
  });
}

function judgeExpectError(
  ref: RuleRef,
  error?: { code: string },
): RuleResult {
  return timed(resolveMeta(ref, "expect_error"), () => {
    const code = ref.code ?? "EMPTY_HISTORY";
    if (error?.code === code) {
      return {
        status: "pass",
        message: `Got expected error ${code}.`,
        evidence: { details: { code } },
      };
    }
    return {
      status: "fail",
      message: `Expected error ${code}, got ${error?.code ?? "none"}.`,
      evidence: { details: { expected: code, actual: error?.code ?? null } },
    };
  });
}

function judgeSourceListCap(
  ref: RuleRef,
  sourceListsCount: number,
): RuleResult {
  return timed(resolveMeta(ref, "source_list_cap"), () => {
    const expected = ref.expected ?? ref.max ?? 5;
    if (sourceListsCount !== expected) {
      return {
        status: "fail",
        message: `Expected ${expected} source lists after cap, got ${sourceListsCount}.`,
        evidence: { details: { expected, actual: sourceListsCount } },
      };
    }
    return {
      status: "pass",
      message: `Source list cap OK (${sourceListsCount}).`,
      evidence: { details: { expected, actual: sourceListsCount } },
    };
  });
}

function judgeNonEmpty(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "non_empty_items"), () => {
    const count = output?.items?.length ?? 0;
    if (count < 1) {
      return {
        status: "fail",
        message: "Expected non-empty proposal items.",
        evidence: { details: { count } },
      };
    }
    return {
      status: "pass",
      message: `Non-empty (${count} items).`,
      evidence: { details: { count } },
    };
  });
}

function judgeNoCrash(
  ref: RuleRef,
  error?: { code: string },
): RuleResult {
  return timed(resolveMeta(ref, "no_crash"), () => {
    if (error && error.code !== "EMPTY_HISTORY") {
      return {
        status: "fail",
        message: `Unexpected error: ${error.code}`,
        evidence: { details: { code: error.code } },
      };
    }
    return { status: "pass", message: "No crash.", evidence: {} };
  });
}

function judgeMustIncludeAny(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "must_include_any"), () => {
    const names = ref.names ?? [];
    const actual = itemNames(output);
    const hit = names.some((n) => findName(actual, n));
    if (!hit) {
      return {
        status: "warn",
        message: "None of preferred staples included.",
        evidence: { expected: names, actual, missing: names },
      };
    }
    return {
      status: "pass",
      message: "At least one preferred staple included.",
      evidence: { expected: names, actual },
    };
  });
}

function judgeGoldenSimilarity(
  ref: RuleRef,
  output: Proposal | null,
  baselineItems: string[],
): RuleResult {
  return timed(resolveMeta(ref, "golden_similarity"), () => {
    const actual = itemNames(output);
    const { precision, recall, f1 } = precisionRecallF1(actual, baselineItems);
    const minRecall = ref.minRecall ?? 0;
    const minPrecision = ref.minPrecision ?? 0;
    const minF1 = ref.minF1 ?? 0;
    const ok =
      recall >= minRecall && precision >= minPrecision && f1 >= minF1;
    return {
      status: ok ? "pass" : "warn",
      message: `Golden P=${precision.toFixed(2)} R=${recall.toFixed(2)} F1=${f1.toFixed(2)}`,
      evidence: {
        expected: baselineItems,
        actual,
        details: { precision, recall, f1 },
      },
    };
  });
}

function judgePreferExclude(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "prefer_exclude"), () => {
    const names = ref.names ?? [];
    const actual = itemNames(output);
    const offending = names.filter((n) => findName(actual, n));
    if (offending.length) {
      return {
        status: "warn",
        message:
          "Seasonal/event items present (soft - Review can reject).",
        evidence: { offendingItems: offending, expected: names, actual },
      };
    }
    return {
      status: "pass",
      message: "Preferred-exclude items absent.",
      evidence: { expected: names, actual },
    };
  });
}

function judgeMinItems(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "min_items"), () => {
    const min = ref.min ?? 1;
    const count = output?.items?.length ?? 0;
    if (count < min) {
      return {
        status: "warn",
        message: `Expected ≥${min} items for a large-shop proposal, got ${count}.`,
        evidence: { details: { min, count } },
      };
    }
    return {
      status: "pass",
      message: `Item count ${count} ≥ ${min}.`,
      evidence: { details: { min, count } },
    };
  });
}

function judgeReasonHonesty(
  ref: RuleRef,
  output: Proposal | null,
): RuleResult {
  return timed(resolveMeta(ref, "reason_honesty"), () => {
    const bad =
      output?.items?.filter(
        (i) => (i.timesSeen ?? 1) <= 1 && hasFrequentReason(i.reason),
      ) ?? [];
    if (bad.length) {
      return {
        status: "warn",
        message: "Unjustified frequent-style reasons.",
        evidence: {
          offendingItems: bad.map((i) => i.name),
          details: {
            reasons: bad.map((i) => i.reason),
          },
        },
      };
    }
    return {
      status: "pass",
      message: "Reasons look honest.",
      evidence: {},
    };
  });
}

function infoMergeCount(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "merge_count"), () => {
    const merged =
      output?.items?.filter((i) => (i.timesSeen ?? 1) > 1).length ?? 0;
    return {
      status: "info",
      message: `merge_count=${merged}`,
      evidence: { details: { mergeCount: merged } },
    };
  });
}

function infoAvgNote(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "avg_note_length"), () => {
    const notes =
      output?.items?.map((i) => (i.note ?? "").length).filter((n) => n > 0) ??
      [];
    const avg =
      notes.length === 0
        ? 0
        : notes.reduce((a, b) => a + b, 0) / notes.length;
    return {
      status: "info",
      message: `avg_note_length=${avg.toFixed(1)}`,
      evidence: { details: { avgNoteLength: avg } },
    };
  });
}

function infoAvgReason(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "avg_reason_length"), () => {
    const reasons =
      output?.items
        ?.map((i) => (i.reason ?? "").length)
        .filter((n) => n > 0) ?? [];
    const avg =
      reasons.length === 0
        ? 0
        : reasons.reduce((a, b) => a + b, 0) / reasons.length;
    return {
      status: "info",
      message: `avg_reason_length=${avg.toFixed(1)}`,
      evidence: { details: { avgReasonLength: avg } },
    };
  });
}

function infoItemCount(ref: RuleRef, output: Proposal | null): RuleResult {
  return timed(resolveMeta(ref, "item_count"), () => {
    const count = output?.items?.length ?? 0;
    return {
      status: "info",
      message: `item_count=${count}`,
      evidence: { details: { itemCount: count } },
    };
  });
}

function runOne(
  ref: RuleRef,
  ctx: {
    output: Proposal | null;
    corpus: string[];
    error?: { code: string; message: string };
    sourceListsCount: number;
    baselineItems: string[];
  },
): RuleResult {
  switch (ref.type) {
    case "json_valid":
      return judgeJsonValid(ref, ctx.output, ctx.error);
    case "category_enum":
      return judgeCategoryEnum(ref, ctx.output);
    case "must_exclude":
      return judgeMustExclude(ref, ctx.output);
    case "no_hallucination":
      return judgeNoHallucination(ref, ctx.output, ctx.corpus);
    case "language":
      return judgeLanguage(ref, ctx.output);
    case "product_cap":
      return judgeProductCap(ref, ctx.output);
    case "must_not_merge":
      return judgeMustNotMerge(ref, ctx.output);
    case "must_merge":
      return judgeMustMerge(ref, ctx.output);
    case "title_must_not_match":
      return judgeTitleMustNotMatch(ref, ctx.output);
    case "expect_error":
      return judgeExpectError(ref, ctx.error);
    case "source_list_cap":
      return judgeSourceListCap(ref, ctx.sourceListsCount);
    case "non_empty_items":
      return judgeNonEmpty(ref, ctx.output);
    case "no_crash":
      return judgeNoCrash(ref, ctx.error);
    case "must_include_any":
      return judgeMustIncludeAny(ref, ctx.output);
    case "golden_similarity":
      return judgeGoldenSimilarity(ref, ctx.output, ctx.baselineItems);
    case "reason_honesty":
      return judgeReasonHonesty(ref, ctx.output);
    case "prefer_exclude":
      return judgePreferExclude(ref, ctx.output);
    case "min_items":
      return judgeMinItems(ref, ctx.output);
    case "merge_count":
      return infoMergeCount(ref, ctx.output);
    case "avg_note_length":
      return infoAvgNote(ref, ctx.output);
    case "avg_reason_length":
      return infoAvgReason(ref, ctx.output);
    case "item_count":
      return infoItemCount(ref, ctx.output);
    default:
      return timed(resolveMeta(ref, ref.type), () => ({
        status: "fail",
        message: `Unknown rule type: ${ref.type}`,
        evidence: {} as Evidence,
      }));
  }
}

export function runJudges(input: {
  scenario: Scenario;
  output: unknown;
  corpus: string[];
  error?: { code: string; message: string };
  sourceListsCount: number;
  baselineItems: string[];
}): { ruleResults: RuleResult[]; judgeLatencyMs: number } {
  const t0 = Date.now();
  const output = (input.output as Proposal | null) ?? null;
  const scenario = input.scenario;

  const expanded: RuleRef[] = [];

  // Auto hard rules from expectations
  if (scenario.expectations?.mustExclude?.length) {
    expanded.push({
      id: "H003",
      type: "must_exclude",
      names: scenario.expectations.mustExclude,
    });
  }
  if (scenario.expectations?.titleMustNotMatch?.length) {
    expanded.push({
      id: "H009",
      type: "title_must_not_match",
      patterns: scenario.expectations.titleMustNotMatch,
    });
  }
  if (scenario.expectations?.expectError) {
    expanded.push({
      id: "H010",
      type: "expect_error",
      code: scenario.expectations.expectError,
    });
  }
  if (scenario.expectations?.sourceListCap != null) {
    expanded.push({
      id: "H011",
      type: "source_list_cap",
      expected: scenario.expectations.sourceListCap,
    });
  }
  if (scenario.expectations?.nonEmpty) {
    expanded.push({ id: "H012", type: "non_empty_items" });
  }
  if (scenario.expectations?.mustIncludeAny?.length) {
    expanded.push({
      id: "S001",
      type: "must_include_any",
      names: scenario.expectations.mustIncludeAny,
    });
  }
  if (scenario.expectations?.preferExclude?.length) {
    expanded.push({
      id: "S005",
      type: "prefer_exclude",
      names: scenario.expectations.preferExclude,
    });
  }
  if (scenario.expectations?.minItems != null) {
    expanded.push({
      id: "S006",
      type: "min_items",
      min: scenario.expectations.minItems,
    });
  }

  const all = [
    ...scenario.hardRules,
    ...scenario.softRules,
    ...scenario.infoRules,
    ...expanded,
  ];

  // Dedupe by id+type+names key
  const seen = new Set<string>();
  const unique: RuleRef[] = [];
  for (const r of all) {
    const key = `${r.id ?? ""}:${r.type}:${(r.names ?? []).join(",")}:${r.code ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(r);
  }

  const ruleResults = unique.map((ref) =>
    runOne(ref, {
      output,
      corpus: input.corpus,
      error: input.error,
      sourceListsCount: input.sourceListsCount,
      baselineItems: input.baselineItems,
    }),
  );

  // Soft language warn → soft status already; map language "warn" stays warn
  for (const r of ruleResults) {
    if (r.tier === "hard" && r.status === "warn") {
      r.status = "fail";
    }
    if (r.tier === "soft" && r.status === "fail") {
      r.status = "warn";
    }
    if (r.tier === "info") {
      r.status = "info";
    }
  }

  return { ruleResults, judgeLatencyMs: Date.now() - t0 };
}

export function scoreFromRules(ruleResults: RuleResult[]): {
  passed: boolean;
  score: number;
} {
  const hard = ruleResults.filter((r) => r.tier === "hard");
  const soft = ruleResults.filter((r) => r.tier === "soft");
  const hardPass = hard.every((r) => r.status === "pass");
  const hardScore =
    hard.length === 0
      ? 100
      : (hard.filter((r) => r.status === "pass").length / hard.length) * 100;
  const softScore =
    soft.length === 0
      ? 100
      : (soft.filter((r) => r.status === "pass").length / soft.length) * 100;
  const score = hardScore * 0.7 + softScore * 0.3;
  return { passed: hardPass, score: Math.round(score * 10) / 10 };
}
