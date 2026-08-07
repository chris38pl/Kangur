import { NextResponse } from "next/server";

import { processProviderWebhook } from "@/lib/billing/processWebhook";
import { ApiError } from "@/lib/auth/errors";

export const runtime = "nodejs";

/**
 * App Store Server Notifications V2 — foundation stub.
 * Full JWS verify + entitlement refresh lands with iOS IAP phase.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const result = await processProviderWebhook({
      providerId: "apple",
      type:
        typeof body.notificationType === "string"
          ? body.notificationType
          : "asn.unknown",
      externalId:
        typeof body.notificationUUID === "string"
          ? body.notificationUUID
          : null,
      payload: body as import("@prisma/client").Prisma.InputJsonValue,
      handle: async () => {
        // TODO: verify signedPayload → AppleBillingProvider.getSubscription
        console.info("[billing] Apple ASN V2 received (stub — not applied)");
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[billing] apple webhook error", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 400 },
    );
  }
}
