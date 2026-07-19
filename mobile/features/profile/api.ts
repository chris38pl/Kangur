import { apiFetch } from "@/lib/api/client";

/** Idempotent app-data purge. 204 no body. */
export async function deleteMeAccount(token: string): Promise<void> {
  await apiFetch<void>("/api/v1/me", {
    method: "DELETE",
    token,
  });
}
