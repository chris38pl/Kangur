/**
 * Lets `node --test` load app modules that use Metro-style imports:
 * `@/…` and `@shared/…` aliases (tsconfig paths), extensionless relative
 * imports, and two native modules swapped for in-memory stubs.
 *
 * Usage: node --test --experimental-transform-types \
 *          --import ./scripts/node-test-register.mjs <file>.test.ts
 */
import { statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(scriptsDir, "..");
const sharedRoot = path.resolve(mobileRoot, "../shared");

const STUBS = {
  "react-native": path.join(scriptsDir, "node-test-stubs/react-native.mjs"),
  "@react-native-async-storage/async-storage": path.join(
    scriptsDir,
    "node-test-stubs/async-storage.mjs",
  ),
};

const CANDIDATE_SUFFIXES = [
  "",
  ".ts",
  ".tsx",
  ".js",
  "/index.ts",
  "/index.tsx",
  "/index.js",
];

function isFile(candidate) {
  try {
    return statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function resolveFile(base) {
  for (const suffix of CANDIDATE_SUFFIXES) {
    if (isFile(base + suffix)) return base + suffix;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = STUBS[specifier];
    if (stub) {
      return { url: pathToFileURL(stub).href, shortCircuit: true };
    }

    let base = null;
    if (specifier.startsWith("@/")) {
      base = path.join(mobileRoot, specifier.slice(2));
    } else if (specifier.startsWith("@shared/")) {
      base = path.join(sharedRoot, specifier.slice("@shared/".length));
    } else if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.startsWith("file:")
    ) {
      base = path.resolve(
        path.dirname(fileURLToPath(context.parentURL)),
        specifier,
      );
    }

    const file = base ? resolveFile(base) : null;
    if (file) {
      return { url: pathToFileURL(file).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

// Metro defines this global; app modules read it at runtime.
globalThis.__DEV__ = false;
