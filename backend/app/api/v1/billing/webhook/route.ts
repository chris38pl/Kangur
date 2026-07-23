import { NextResponse } from "next/server";

import { handleStripeWebhook } from "@/features/billing/handleStripeWebhook";
import { BillingWebhookAckSchema } from "@/features/billing/schemas";
import { ApiError } from "@/lib/auth/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    const result = await handleStripeWebhook({ rawBody, signature });
    return NextResponse.json(BillingWebhookAckSchema.parse(result));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[billing] webhook error", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 400 },
    );
  }
}
