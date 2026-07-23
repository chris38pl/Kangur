import { apiFetch } from "@/lib/api/client";

import {
  AppVersionResponseSchema,
  type AppVersionResponse,
} from "./schemas";

/** Public — no auth. Best-effort soft update policy. */
export async function fetchAppVersion(): Promise<AppVersionResponse> {
  const data = await apiFetch<unknown>("/api/v1/app/version");
  return AppVersionResponseSchema.parse(data);
}
