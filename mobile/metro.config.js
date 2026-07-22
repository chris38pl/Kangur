const path = require("path");
const fs = require("fs");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
// Metro FileMap cannot SHA-1 files outside projectRoot reliably in this
// monorepo layout (eager EAS bundle). sync-shared.js mirrors ../shared here.
const sharedRoot = path.resolve(projectRoot, ".shared");

const config = getDefaultConfig(projectRoot);

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

/**
 * Map package.json "exports" subpaths that Metro misses when
 * unstable_enablePackageExports is false (needed for Hermes/web stability).
 * PostHog RN eagerly imports @posthog/core/surveys.
 */
function resolvePostHogCoreSubpath(moduleName) {
  if (
    moduleName !== "@posthog/core" &&
    !moduleName.startsWith("@posthog/core/")
  ) {
    return null;
  }
  const coreRoot = path.resolve(projectRoot, "node_modules/@posthog/core");
  if (!fs.existsSync(coreRoot)) return null;

  if (moduleName === "@posthog/core") {
    const main = path.join(coreRoot, "dist/index.js");
    return fs.existsSync(main) ? main : null;
  }

  const rest = moduleName.slice("@posthog/core/".length);
  const candidates = [
    path.join(coreRoot, "dist", rest, "index.js"),
    path.join(coreRoot, "dist", `${rest}.js`),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@shared/")) {
    const rel = moduleName.slice("@shared/".length);
    return {
      type: "sourceFile",
      filePath: path.resolve(sharedRoot, `${rel}.ts`),
    };
  }

  const posthogCore = resolvePostHogCoreSubpath(moduleName);
  if (posthogCore) {
    return { type: "sourceFile", filePath: posthogCore };
  }

  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Avoid web/ESM export maps breaking Hermes in Expo Go (common on RN 0.79+)
// Keep false; PostHog subpaths handled above.
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./global.css" });
