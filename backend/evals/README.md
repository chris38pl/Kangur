# AI Evaluation Framework

Offline harness for Kangur AI proposals. Not a runtime path.

**History Suggest philosophy (suite v2):** evaluate **complete large weekly grocery proposals** for Review UX - not aggressive shortlist prediction. Prefer grocery recall; DIY hard-exclude; seasonal soft `preferExclude`.

## Quick start

```bash
cd backend
# Uses OPENAI_API_KEY from backend/.env or .env.local (same as Next.js)
pnpm eval:ai --suite history-suggest
pnpm eval:ai --suite history-suggest --only grill-one-off
pnpm eval:ai --suite history-suggest --repeat 5
pnpm eval:ai --suite history-suggest --prompt history-v3 --compare-prompt production
pnpm eval:ai --suite history-suggest --write-golden grill-one-off --force
# Meal Proposal (M21) — offline fixtures need no OpenAI key
pnpm eval:ai --suite meal-proposal --only dedupe-cheese-two-meals
pnpm eval:ai --suite meal-proposal
# Shopping Categories Eval (offline CategoryCorrections + aisle catalog)
pnpm eval:ai --suite shopping-categories
# Text ingest — ITEM IDENTIFICATION / shoppingContext (needs OpenAI)
pnpm eval:ai --suite text-ingest
pnpm eval:prune-reports
```

## Architecture

```
Scenario YAML → thin Adapter → Evaluator → Judges → Report
```

- **Adapter** (`adapters/historySuggest.ts`, `adapters/mealProposal.ts`, `adapters/shoppingCategories.ts`, `adapters/textIngest.ts`): validates fixture input, calls production builders (`buildSuggestFromHistory` / `buildMealProposal` / CategoryCorrections / `buildProposalFromText`), returns raw + normalized + corpus.
- **Evaluator**: timing, default seed (`424242`), `--repeat` stability, telemetry.
- **Judges**: hard / soft / info with stable IDs (`H003`, `S002`, `H014`, `H017`, …), structured evidence, per-judge latency.
- **Report**: dated under `reports/YYYY-MM-DD/` (gitignored); includes repro command, cost aggregates, corpus snapshot.

### Suites

| Suite | Adapter | Notes |
|-------|---------|--------|
| `history-suggest` | `shopping-history` | Weekly grocery from history; needs OpenAI for model scenarios |
| `meal-proposal` | `meal-proposal` | Dish → ingredients; `mealsFixture` scenarios are offline (0 tokens) |
| `shopping-categories` | `shopping-categories` | Offline CategoryCorrections + aisle golden catalog (0 tokens) |
| `text-ingest` | `text-ingest` | Typed/clipboard lists → items + shoppingContext; needs OpenAI |

## Suite versioning

- `suite.yaml` → `suiteVersion`
- each scenario → `scenarioVersion`

Bump scenario version when fixtures/expectations/golden change so historical runs stay comparable.

## Golden baselines

Optional `baseline.items` or `baseline.outputRef: golden/<id>.json`.

`--write-golden <id>` only when all hard rules PASS, and only after typing `YES` or passing `--force`.

## Retention

After each run (unless `--skip-prune`): delete reports older than 30 days, then keep at most 100 JSON runs.
