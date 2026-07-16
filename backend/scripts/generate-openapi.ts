import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateOpenApiDocument } from "../openapi/registry";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "openapi", "openapi.json");

mkdirSync(dirname(outPath), { recursive: true });

const document = {
  ...generateOpenApiDocument(),
  "x-generated": true,
  "x-generated-note":
    "AUTO-GENERATED from Zod. Run `pnpm openapi:generate`. Do not hand-edit.",
};

writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
console.log(`Wrote ${outPath}`);
