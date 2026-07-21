import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { parse as parseYaml } from "yaml";

import { ScenarioSchema, type Scenario } from "../schema/scenario";
import { SuiteMetaSchema, type SuiteMeta } from "../schema/suite";

export type LoadedSuite = {
  meta: SuiteMeta;
  scenarios: Scenario[];
  suiteDir: string;
};

export function evalsRoot(): string {
  return path.resolve(process.cwd(), "evals");
}

export async function loadSuite(suiteName: string): Promise<LoadedSuite> {
  const suiteDir = path.join(evalsRoot(), "suites", suiteName);
  const metaRaw = await readFile(path.join(suiteDir, "suite.yaml"), "utf8");
  const meta = SuiteMetaSchema.parse(parseYaml(metaRaw));

  const scenariosDir = path.join(suiteDir, "scenarios");
  const files = (await readdir(scenariosDir))
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort();

  const scenarios: Scenario[] = [];
  for (const file of files) {
    const raw = await readFile(path.join(scenariosDir, file), "utf8");
    const parsed = ScenarioSchema.parse(parseYaml(raw));
    scenarios.push(parsed);
  }

  return { meta, scenarios, suiteDir };
}

export async function loadBaselineItems(
  suiteDir: string,
  scenario: Scenario,
): Promise<string[]> {
  if (scenario.baseline?.items?.length) {
    return scenario.baseline.items;
  }
  if (scenario.baseline?.outputRef) {
    const file = path.join(suiteDir, scenario.baseline.outputRef);
    const raw = JSON.parse(await readFile(file, "utf8")) as {
      items?: Array<{ name: string } | string>;
    };
    return (raw.items ?? []).map((i) =>
      typeof i === "string" ? i : i.name,
    );
  }
  return [];
}
