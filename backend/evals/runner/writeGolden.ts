import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ScenarioRunResult } from "../adapters/types";

export async function writeGolden(opts: {
  suiteDir: string;
  scenarioId: string;
  result: ScenarioRunResult;
  force: boolean;
}): Promise<string> {
  const hardFailed = opts.result.ruleResults.some(
    (r) => r.tier === "hard" && r.status === "fail",
  );
  if (hardFailed) {
    throw new Error(
      `Refusing to write golden for ${opts.scenarioId}: hard rules failed.`,
    );
  }
  if (!opts.result.normalizedOutput) {
    throw new Error(
      `Refusing to write golden for ${opts.scenarioId}: no normalized output.`,
    );
  }

  if (!opts.force) {
    const rl = createInterface({ input, output });
    const answer = await rl.question(
      `Write golden for ${opts.scenarioId}? Type YES to confirm: `,
    );
    rl.close();
    if (answer.trim() !== "YES") {
      throw new Error("Golden write cancelled (confirmation required or use --force).");
    }
  }

  const dir = path.join(opts.suiteDir, "golden");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${opts.scenarioId}.json`);
  await writeFile(
    file,
    JSON.stringify(opts.result.normalizedOutput, null, 2),
    "utf8",
  );
  return file;
}
