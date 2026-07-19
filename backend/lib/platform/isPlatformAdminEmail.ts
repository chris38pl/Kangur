import { normalizeEmail } from "@/lib/email/normalizeEmail";

/**
 * Env-configured allowlist for bootstrapping Platform Console admins.
 * Comma-separated emails in PLATFORM_ADMIN_EMAILS (trim + lowercase).
 * Empty / unset → nobody auto-promoted.
 */
export function getPlatformAdminAllowlist(): Set<string> {
  const raw = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) return new Set();

  const emails = raw
    .split(",")
    .map((part) => normalizeEmail(part))
    .filter((email) => email.includes("@"));

  return new Set(emails);
}

/** True when normalized email is listed in PLATFORM_ADMIN_EMAILS. */
export function isPlatformAdminEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getPlatformAdminAllowlist().has(normalized);
}
