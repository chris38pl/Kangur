import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

/**
 * Load backend/.env then .env.local (same precedence idea as Next.js).
 * Does not override variables already set in the process environment.
 */
export function loadEvalEnv(cwd = process.cwd()): void {
  for (const name of [".env", ".env.local"]) {
    const file = path.join(cwd, name);
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}
