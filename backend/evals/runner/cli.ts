#!/usr/bin/env tsx
/**
 * AI eval CLI - see backend/evals/README.md
 *
 *   pnpm eval:ai --suite history-suggest
 *   pnpm eval:ai --suite history-suggest --only grill-one-off --repeat 5
 */
import { loadEvalEnv } from "./loadEnv";
import { runSuite, type CliOptions } from "./suiteRunner";
import { pruneReports } from "./writeReport";

function parseArgs(argv: string[]): CliOptions & { pruneOnly?: boolean } {
  const opts: CliOptions & { pruneOnly?: boolean } = {
    suite: "history-suggest",
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const next = () => {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value after ${a}`);
      return v;
    };
    switch (a) {
      case "--suite":
        opts.suite = next();
        break;
      case "--model":
        opts.model = next();
        break;
      case "--only":
        opts.only = next()
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "--prompt":
        opts.prompt = next();
        break;
      case "--compare-prompt":
        opts.comparePrompt = next();
        break;
      case "--compare-model":
        opts.compareModel = next();
        break;
      case "--repeat":
        opts.repeat = Number(next());
        break;
      case "--seed":
        opts.seed = Number(next());
        break;
      case "--write-golden":
        opts.writeGolden = next();
        break;
      case "--force":
        opts.force = true;
        break;
      case "--skip-prune":
        opts.skipPrune = true;
        break;
      case "--prune-only":
        opts.pruneOnly = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        if (a.startsWith("-")) {
          throw new Error(`Unknown flag: ${a}`);
        }
    }
  }
  return opts;
}

function printHelp() {
  console.log(`Usage: pnpm eval:ai [options]

Options:
  --suite <name>              Suite under evals/suites/ (default: history-suggest)
  --model <id>                Model override
  --only <id,id>              Run subset of scenarios
  --prompt <id>               Named prompt id (default: production)
  --compare-prompt <id>       Side-by-side prompt compare
  --compare-model <id>        Side-by-side model compare
  --repeat <n>                Flaky detection (fixed seed)
  --seed <n>                  Override default seed (424242)
  --write-golden <id>         Write golden after hard PASS (confirm or --force)
  --force                     Skip golden confirm prompt
  --skip-prune                Do not prune reports after run
  --prune-only                Only prune dated reports
`);
}

async function main() {
  loadEvalEnv();

  const opts = parseArgs(process.argv.slice(2));
  if (opts.pruneOnly) {
    const { removed } = await pruneReports();
    console.log(`Pruned ${removed.length} artifacts.`);
    return;
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error(
      "Missing OPENAI_API_KEY (set in backend/.env.local or environment).",
    );
  }

  const result = await runSuite(opts);
  console.log(result.txtPath);
  console.log(
    `\nDone: ${result.report.passed} passed, ${result.report.failed} failed.`,
  );
  process.exit(result.exitCode);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(2);
});
