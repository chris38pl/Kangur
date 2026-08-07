import type { BillingProviderId, Prisma } from "@prisma/client";

import {
  recordWebhookFailure,
  recordWebhookProcessingMs,
} from "./monitoring";
import { BillingRegistry } from "./registry";
import { appendBillingEvent } from "./upsertEntitlement";

/**
 * Shared webhook pipeline for all billing providers:
 * append BillingEvent → provider handler → entitlement.
 */
export async function processProviderWebhook(input: {
  providerId: BillingProviderId;
  type: string;
  externalId?: string | null;
  payload?: Prisma.InputJsonValue;
  handle: () => Promise<void>;
}): Promise<{ received: true }> {
  const started = Date.now();
  try {
    await appendBillingEvent({
      providerId: input.providerId,
      type: input.type,
      externalId: input.externalId ?? null,
      payload: input.payload,
      processed: false,
    });

    BillingRegistry.resolve(input.providerId);
    await input.handle();

    recordWebhookProcessingMs(input.providerId, Date.now() - started);
    return { received: true };
  } catch (err) {
    recordWebhookFailure(
      input.providerId,
      err instanceof Error ? err.message : "unknown",
    );
    throw err;
  }
}
