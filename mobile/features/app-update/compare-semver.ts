/**
 * Plain semver only: MAJOR.MINOR.PATCH (e.g. 1.0.0, 1.2.3, 2.1.14).
 * Pre-release tags (1.0.0-beta, 1.0.0-rc1) are not supported on MVP.
 */

const PLAIN_SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

export type SemverParts = { major: number; minor: number; patch: number };

export function parsePlainSemver(version: string): SemverParts | null {
  const match = version.trim().match(PLAIN_SEMVER);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

/** @returns -1 if a < b, 0 if equal, 1 if a > b; null if either is not plain semver. */
export function compareSemver(a: string, b: string): -1 | 0 | 1 | null {
  const left = parsePlainSemver(a);
  const right = parsePlainSemver(b);
  if (!left || !right) return null;

  if (left.major !== right.major) return left.major < right.major ? -1 : 1;
  if (left.minor !== right.minor) return left.minor < right.minor ? -1 : 1;
  if (left.patch !== right.patch) return left.patch < right.patch ? -1 : 1;
  return 0;
}

export function isVersionNewer(latest: string, installed: string): boolean {
  return compareSemver(latest, installed) === 1;
}
