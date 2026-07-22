const path = require("path");
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

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@shared/")) {
    const rel = moduleName.slice("@shared/".length);
    return {
      type: "sourceFile",
      filePath: path.resolve(sharedRoot, `${rel}.ts`),
    };
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Avoid web/ESM export maps breaking Hermes in Expo Go (common on RN 0.79+)
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./global.css" });
