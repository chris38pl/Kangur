import { isVersionNewer } from "./compare-semver";

export type UpdateKind = "none" | "soft" | "force";

export type UpdatePolicyInput = {
  installed: string;
  latestVersion: string;
  minSupportedVersion: string;
};

export type UpdatePolicyResult = {
  kind: UpdateKind;
};

/**
 * Single decision point for soft / future force update.
 * Unparseable semver → none (best-effort: never block the user).
 */
export function evaluateUpdatePolicy(
  input: UpdatePolicyInput,
): UpdatePolicyResult {
  const { installed, latestVersion, minSupportedVersion } = input;

  if (isVersionNewer(minSupportedVersion, installed)) {
    return { kind: "force" };
  }

  if (isVersionNewer(latestVersion, installed)) {
    return { kind: "soft" };
  }

  return { kind: "none" };
}
