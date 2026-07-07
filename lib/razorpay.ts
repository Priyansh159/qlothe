import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,          // safe-ish to expose (key ID only)
  key_secret: process.env.RAZORPAY_KEY_SECRET!,  // server-only. NEVER NEXT_PUBLIC_.
});

/** Create a Razorpay order for an amount computed SERVER-SIDE (paise). */
export async function createRazorpayOrder(amountPaise: number, orderNumber: string) {
  return razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: orderNumber,
  });
}

/** Verify the HMAC signature on an incoming webhook. Constant-time compare. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false; // length mismatch etc.
  }
}
