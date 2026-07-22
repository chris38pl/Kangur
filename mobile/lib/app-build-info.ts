import Constants from "expo-constants";

export type AppEnvironment = "development" | "preview" | "production";

export type AppBuildInfo = {
  version: string;
  /** Native build number / versionCode, or "-" when unavailable (e.g. Dev Client). */
  build: string;
  environment: AppEnvironment;
  commit: string | null;
  /** Host from EXPO_PUBLIC_API_URL (or "-"). */
  apiHost: string;
  isDevelopment: boolean;
  /**
   * Header label:
   * - Development: "Development Build" (caller should i18n via developmentBuild key)
   * - Otherwise: "1.0.0 (Build 127)"
   */
  displayLabel: string;
};

function parseEnvironment(raw: string | undefined): AppEnvironment {
  if (raw === "preview" || raw === "production" || raw === "development") {
    return raw;
  }
  return __DEV__ ? "development" : "production";
}

function resolveApiHost(apiLabel: string | undefined): string {
  if (apiLabel?.trim()) return apiLabel.trim();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!apiUrl) return "-";
  try {
    return new URL(apiUrl).host;
  } catch {
    return apiUrl;
  }
}

function shortCommit(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value || value === "-") return null;
  return value.slice(0, 7);
}

/**
 * Single source for version / build / env / commit / API host
 * (About, Profile, future diagnostics).
 */
export function getAppBuildInfo(): AppBuildInfo {
  const extra = Constants.expoConfig?.extra as
    | { appEnv?: string; gitCommit?: string; apiLabel?: string }
    | undefined;

  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";
  const build =
    Constants.nativeBuildVersion ??
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode?.toString() ??
    "-";

  const environment = parseEnvironment(
    extra?.appEnv ?? process.env.EXPO_PUBLIC_APP_ENV?.trim(),
  );
  const isDevelopment = __DEV__ || environment === "development";

  const commit = shortCommit(
    extra?.gitCommit ?? process.env.EXPO_PUBLIC_GIT_COMMIT,
  );
  const apiHost = resolveApiHost(extra?.apiLabel);

  const displayLabel = isDevelopment
    ? "Development Build"
    : build !== "-"
      ? `${version} (Build ${build})`
      : version;

  return {
    version,
    build,
    environment,
    commit,
    apiHost,
    isDevelopment,
    displayLabel,
  };
}
