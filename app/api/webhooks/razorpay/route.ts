import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { handlePaymentCaptured, handlePaymentFailed } from "@/services/payments";

/**
 * THE source of truth for money. The browser's success callback never
 * changes order state — only this route does, after HMAC verification.
 * NOTE: signature is computed over the RAW body — read text() first,
 * never req.json() before verifying.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  switch (event.event) {
    case "payment.captured":
      await handlePaymentCaptured(event.payload, event);
      break;
    case "payment.failed":
      await handlePaymentFailed(event.payload, event);
      break;
    default:
      break; // acknowledge everything else so Razorpay stops retrying
  }

  // Always 200 after signature check — retries are for delivery failures,
  // not business outcomes (idempotency already protects us).
  return NextResponse.json({ received: true });
}
