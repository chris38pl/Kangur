import { apiFetch } from "@/lib/api/client";

import {
  AiCreditsBalanceSchema,
  type AiCreditsBalance,
} from "./schemas";

export async function getAiCredits(
  token: string,
  workspaceId: string,
): Promise<AiCreditsBalance> {
  const data = await apiFetch<unknown>(
    `/api/v1/workspaces/${workspaceId}/ai-credits`,
    { token },
  );
  return AiCreditsBalanceSchema.parse(data);
}
