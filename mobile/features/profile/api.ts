import { MeSchema, type MeUser } from "@/features/auth/useMe";
import { apiFetch } from "@/lib/api/client";
import type { AppLocale } from "@/lib/i18n/locales";

/** Idempotent app-data purge. 204 no body. */
export async function deleteMeAccount(token: string): Promise<void> {
  await apiFetch<void>("/api/v1/me", {
    method: "DELETE",
    token,
  });
}

/** Persist app language to the user profile. */
export async function updateMeLocale(
  token: string,
  locale: AppLocale,
): Promise<MeUser> {
  const data = await apiFetch<unknown>("/api/v1/me", {
    method: "PATCH",
    token,
    body: { locale },
  });
  return MeSchema.parse(data);
}

/**
 * The name other people see. Null removes it. Kangur keeps it; nothing goes to Clerk.
 * The server refuses an address (details.reason "name_email") or more than 30 characters.
 */
export async function updateMeDisplayName(
  token: string,
  displayName: string | null,
): Promise<MeUser> {
  const data = await apiFetch<unknown>("/api/v1/me", {
    method: "PATCH",
    token,
    body: { displayName },
  });
  return MeSchema.parse(data);
}
