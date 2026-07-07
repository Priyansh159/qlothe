import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Handle `payment.captured` from Razorpay. Fully idempotent:
 * the UNIQUE constraint on razorpayPaymentId means a retried webhook
 * hits P2002 and we exit quietly — no double emails, no double state moves.
 */
export async function handlePaymentCaptured(payload: any, rawEvent: any) {
  const entity = payload?.payment?.entity;
  if (!entity?.id || !entity?.order_id) return { ok: false, reason: "malformed payload" };

  const order = await db.order.findUnique({
    where: { razorpayOrderId: entity.order_id },
    select: { id: true, status: true, total: true, orderNumber: true },
  });
  if (!order) return { ok: false, reason: "unknown razorpay order" };

  // Amount must match what WE computed. A mismatch is fraud or a bug — flag it.
  if (entity.amount !== order.total) {
    await db.orderStatusHistory.create({
      data: { orderId: order.id, status: order.status,
              note: `AMOUNT MISMATCH: webhook ${entity.amount}, order ${order.total}` },
    });
    return { ok: false, reason: "amount mismatch" };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: order.id,
          razorpayOrderId: entity.order_id,
          razorpayPaymentId: entity.id, // UNIQUE → idempotency gate
          amount: entity.amount,
          status: "CAPTURED",
          rawWebhook: rawEvent, // keep the evidence
        },
      });
      // State machine: only PENDING may become PAID.
      const res = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: { status: "PAID" },
      });
      if (res.count === 1) {
        await tx.orderStatusHistory.create({
          data: { orderId: order.id, status: "PAID", note: `Razorpay ${entity.id}` },
        });
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: true, reason: "duplicate webhook, already processed" };
    }
    throw e;
  }

  // TODO: enqueue/send confirmation email (services/email.ts) — after commit.
  return { ok: true, orderNumber: order.orderNumber };
}

export async function handlePaymentFailed(payload: any, rawEvent: any) {
  const entity = payload?.payment?.entity;
  if (!entity?.order_id) return { ok: false };
  const order = await db.order.findUnique({ where: { razorpayOrderId: entity.order_id } });
  if (!order) return { ok: false };
  // Don't cancel here — the customer may retry payment on the same order.
  // The 30-min cron is the final cleanup.
  await db.payment.create({
    data: {
      orderId: order.id,
      razorpayOrderId: entity.order_id,
      razorpayPaymentId: entity.id ?? null,
      amount: entity.amount ?? 0,
      status: "FAILED",
      rawWebhook: rawEvent,
    },
  }).catch(() => {}); // duplicate failure events are fine to drop
  return { ok: true };
}
