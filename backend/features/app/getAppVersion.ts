import type { AppVersionResponseDto } from "./schemas";

const DEFAULT_LATEST_VERSION = "1.0.1";
const DEFAULT_MIN_SUPPORTED_VERSION = "1.0.0";
const DEFAULT_PUBLISHED_AT = "1970-01-01T00:00:00.000Z";

function readVersionEnv(name: string, fallback: string): string {
  const raw = process.env[name]?.trim();
  return raw && raw.length > 0 ? raw : fallback;
}

function readPublishedAt(): string {
  const raw = process.env.APP_PUBLISHED_AT?.trim();
  if (!raw) return DEFAULT_PUBLISHED_AT;
  const ms = Date.parse(raw);
  if (Number.isNaN(ms)) return DEFAULT_PUBLISHED_AT;
  return new Date(ms).toISOString();
}

/**
 * Mobile app version policy from env (ops bumps on release — no mobile rebuild).
 */
export function getAppVersion(): AppVersionResponseDto {
  return {
    latestVersion: readVersionEnv("APP_LATEST_VERSION", DEFAULT_LATEST_VERSION),
    minSupportedVersion: readVersionEnv(
      "APP_MIN_SUPPORTED_VERSION",
      DEFAULT_MIN_SUPPORTED_VERSION,
    ),
    publishedAt: readPublishedAt(),
  };
}
