/**
 * Smoke: AI output language policy (actor → owner → en).
 * No DB. Usage: pnpm exec tsx scripts/smoke-ai-output-language.ts
 */
import assert from "node:assert/strict";

import {
  AI_NAMING_RULES,
  AI_PROMPTS,
  pickAiLanguageFromLocales,
  type AiOutputLanguage,
} from "../features/ai/outputLanguage";

function check(
  label: string,
  actor: string | null | undefined,
  owner: string | null | undefined,
  expected: AiOutputLanguage,
) {
  const got = pickAiLanguageFromLocales(actor, owner);
  assert.equal(got, expected, `${label}: got ${got}, expected ${expected}`);
  console.log(`ok  ${label} → ${got}`);
}

function main() {
  // Actor wins even when owner / "workspace-like" locale differs.
  check("actor en, owner pl", "en", "pl", "en");
  check("actor fr, owner de", "fr", "de", "fr");
  check("actor de, owner null", "de", null, "de");

  // Owner fallback when actor locale missing/invalid.
  check("actor null, owner de", null, "de", "de");
  check("actor invalid, owner pl", "xx", "pl", "pl");

  // Final fallback is EN (not PL, not workspace settings).
  check("both null → en", null, null, "en");
  check("both invalid → en", "xx", "yy", "en");

  // Input language must NOT influence pick (documented by absence of text arg).
  assert.equal(
    pickAiLanguageFromLocales("en", "pl"),
    "en",
    "PL paste with EN actor must still resolve to en",
  );

  // Naming rules present for brands / regional / natural terms.
  for (const needle of [
    "Coca-Cola",
    "Guanciale",
    "Italian bacon",
    "Cukier puder",
    "Powdered sugar",
    "Sugar powder",
  ]) {
    assert.ok(
      AI_NAMING_RULES.includes(needle),
      `AI_NAMING_RULES missing ${needle}`,
    );
  }
  console.log("ok  AI_NAMING_RULES contains brand/regional/canonical cues");

  // Every locale has localized title examples (no shared PL-only titles).
  for (const lang of Object.keys(AI_PROMPTS) as AiOutputLanguage[]) {
    const cfg = AI_PROMPTS[lang];
    assert.ok(cfg.titleExamples.length >= 3, `${lang} titleExamples`);
    assert.ok(cfg.titleAntiExamples.length >= 2, `${lang} titleAntiExamples`);
  }
  assert.ok(
    AI_PROMPTS.en.titleExamples.includes("Shopping"),
    "EN titles should include Shopping",
  );
  assert.ok(
    AI_PROMPTS.pl.titleExamples.includes("Zakupy"),
    "PL titles should include Zakupy",
  );
  console.log("ok  titleExamples present for all AI locales");

  console.log("\nAll smoke checks passed.");
}

main();
