import { apiFetch } from "@/lib/api/client";

import {
  AiCreditsBalanceSchema,
  BillingSyncResponseSchema,
  BillingUrlResponseSchema,
  PremiumPriceSchema,
  type AiCreditsBalance,
  type BillingSyncResponse,
  type BillingUrlResponse,
  type PremiumPrice,
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

export async function getPremiumPrice(token: string): Promise<PremiumPrice> {
  const data = await apiFetch<unknown>(`/api/v1/billing/premium-price`, {
    token,
  });
  return PremiumPriceSchema.parse(data);
}

export async function createBillingCheckout(
  token: string,
  workspaceId: string,
): Promise<BillingUrlResponse> {
  const data = await apiFetch<unknown>(
    `/api/v1/workspaces/${workspaceId}/billing/checkout`,
    { method: "POST", token },
  );
  return BillingUrlResponseSchema.parse(data);
}

export async function createBillingPortal(
  token: string,
  workspaceId: string,
): Promise<BillingUrlResponse> {
  const data = await apiFetch<unknown>(
    `/api/v1/workspaces/${workspaceId}/billing/portal`,
    { method: "POST", token },
  );
  return BillingUrlResponseSchema.parse(data);
}

export async function syncBillingEntitlement(
  token: string,
  workspaceId: string,
): Promise<BillingSyncResponse> {
  const data = await apiFetch<unknown>(
    `/api/v1/workspaces/${workspaceId}/billing/sync`,
    { method: "POST", token },
  );
  return BillingSyncResponseSchema.parse(data);
}
