import { getMetrics } from "@/lib/metrics";

/** Billing Platform monitoring — failures + latency hooks. */

export function recordVerifyFailure(providerId: string, reason: string): void {
  console.warn("[billing.monitor]", "verifyPurchase_failed", {
    providerId,
    reason,
  });
  getMetrics().increment("billing_verify_failures", 1, {
    provider: providerId,
  });
}

export function recordWebhookFailure(providerId: string, reason: string): void {
  console.warn("[billing.monitor]", "webhook_failed", {
    providerId,
    reason,
  });
  getMetrics().increment("billing_webhook_failures", 1, {
    provider: providerId,
  });
}

export function recordAcknowledgeFailure(
  providerId: string,
  reason: string,
): void {
  console.warn("[billing.monitor]", "acknowledge_failed", {
    providerId,
    reason,
  });
  getMetrics().increment("billing_ack_failures", 1, {
    provider: providerId,
  });
}

export function recordDuplicatePurchase(providerId: string): void {
  console.info("[billing.monitor]", "duplicate_purchase", { providerId });
  getMetrics().increment("billing_duplicate_purchases", 1, {
    provider: providerId,
  });
}

export function recordOrphanPurchase(externalId: string): void {
  console.warn("[billing.monitor]", "orphan_purchase", { externalId });
  getMetrics().increment("billing_orphan_purchases", 1);
}

export function recordPurchaseToEntitlementMs(
  providerId: string,
  ms: number,
): void {
  getMetrics().timing("billing_purchase_to_entitlement_ms", ms, {
    provider: providerId,
  });
}

export function recordWebhookProcessingMs(
  providerId: string,
  ms: number,
): void {
  getMetrics().timing("billing_webhook_processing_ms", ms, {
    provider: providerId,
  });
}

export function recordPendingWebhookQueue(depth: number, oldestAgeMs: number): void {
  getMetrics().gauge("billing_webhook_queue_depth", depth);
  getMetrics().gauge("billing_webhook_oldest_age_ms", oldestAgeMs);
}

export function recordUnknownPurchaseToken(providerId: string): void {
  console.warn("[billing.monitor]", "unknown_purchase_token", { providerId });
  getMetrics().increment("billing_unknown_purchase_token", 1, {
    provider: providerId,
  });
}

export function recordProviderMismatch(input: {
  workspaceId: string;
  incomingProviderId: string;
  existingProviderId: string;
  externalId: string;
}): void {
  console.warn("[billing.monitor]", "provider_mismatch", input);
  getMetrics().increment("billing_provider_mismatch", 1, {
    incoming: input.incomingProviderId,
    existing: input.existingProviderId,
  });
}
