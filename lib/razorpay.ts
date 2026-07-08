import Razorpay from "razorpay";
import crypto from "crypto";

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay is not configured");
  }
  return new Razorpay({
    key_id, // safe-ish to expose (key ID only)
    key_secret, // server-only. NEVER NEXT_PUBLIC_.
  });
}

/** Create a Razorpay order for an amount computed SERVER-SIDE (paise). */
export async function createRazorpayOrder(amountPaise: number, orderNumber: string) {
  return getRazorpay().orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: orderNumber,
  });
}

/** Verify the HMAC signature on an incoming webhook. Constant-time compare. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false; // length mismatch etc.
  }
}
