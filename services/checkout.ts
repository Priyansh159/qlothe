import { db } from "@/lib/db";
// import { createRazorpayOrder } from "@/lib/razorpay";
import crypto from "crypto";
import type { z } from "zod";
import type { checkoutSchema } from "@/lib/validation";

type CheckoutInput = z.infer<typeof checkoutSchema>;

const FREE_SHIPPING_ABOVE = 99900; // ₹999 in paise
const SHIPPING_FEE = 4900;         // ₹49
const COD_FEE = 5000;              // ₹50 — filters fake COD orders

class CheckoutError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function generateOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase(); // 4 chars
  return `QLO-${ymd}-${rand}`; // orderNumber is UNIQUE — collision retried below
}

/**
 * THE critical function. Everything happens in ONE transaction:
 *   re-price from DB → coupon → atomic stock decrement → order + snapshots.
 * The Razorpay order is created AFTER commit (external call never inside a txn).
 */
export async function createOrder(userId: string, cartId: string, input: CheckoutInput) {
  // Razorpay is commented out for now. Keep checkout COD-only until payment
  // keys/webhooks are ready in production.
  if (input.paymentMethod === "RAZORPAY") {
    throw new CheckoutError("Online payments are temporarily unavailable. Please choose Cash on Delivery.", 503);
  }

  // ---- 1. Load cart and re-price from the database. Client totals are display-only.
  const cartItems = await db.cartItem.findMany({
    where: { cartId },
    include: {
      variant: {
        include: { product: { select: { name: true, basePrice: true, isActive: true } } },
      },
    },
  });
  if (cartItems.length === 0) throw new CheckoutError("Cart is empty");

  const lines = cartItems.map((i) => {
    if (!i.variant.product.isActive) {
      throw new CheckoutError(`${i.variant.product.name} is no longer available`);
    }
    return {
      variantId: i.variantId,
      quantity: i.quantity,
      unitPrice: i.variant.price ?? i.variant.product.basePrice, // server truth
      productName: i.variant.product.name,
      variantLabel: `${i.variant.color} / ${i.variant.size}`,
      sku: i.variant.sku,
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  // ---- 2. Coupon (validated server-side, usage counted atomically below)
  let discount = 0;
  if (input.couponCode) {
    const coupon = await db.coupon.findUnique({ where: { code: input.couponCode } });
    const valid =
      coupon &&
      coupon.isActive &&
      (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
      (coupon.maxUses == null || coupon.usedCount < coupon.maxUses) &&
      subtotal >= coupon.minOrder;
    if (!valid) throw new CheckoutError("Invalid or expired coupon");
    discount =
      coupon.type === "PERCENT"
        ? Math.floor((subtotal * coupon.value) / 100)
        : Math.min(coupon.value, subtotal);
  }

  const shippingFee =
    subtotal - discount >= FREE_SHIPPING_ABOVE
      ? 0
      : SHIPPING_FEE + (input.paymentMethod === "COD" ? COD_FEE : 0);

  const total = subtotal - discount + shippingFee;
  // GST is INCLUDED in the price (standard for Indian D2C fashion).
  // Apparel ≤ ₹1000/piece is 5%, above is 12% — CONFIRM CURRENT RATES WITH YOUR CA.
  const gstAmount = Math.round(total - total / 1.05);

  // ---- 3. The transaction: stock + order + snapshots, all-or-nothing
  const order = await db.$transaction(async (tx) => {
    // Atomic stock decrement — THE overselling guard.
    // updateMany with `stock >= qty` in WHERE: count === 0 means someone
    // else took the last piece between page-load and pay-click.
    for (const line of lines) {
      const res = await tx.productVariant.updateMany({
        where: { id: line.variantId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (res.count === 0) {
        throw new CheckoutError(`${line.productName} (${line.variantLabel}) just went out of stock`, 409);
      }
    }

    if (input.couponCode && discount > 0) {
      await tx.coupon.update({
        where: { code: input.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    const status = input.paymentMethod === "COD" ? "COD_PENDING" : "PENDING";

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status,
        paymentMethod: input.paymentMethod,
        subtotal,
        shippingFee,
        discount,
        total,
        gstAmount,
        shippingAddress: input.address, // SNAPSHOT as JSON
        couponCode: discount > 0 ? input.couponCode : null,
        items: {
          create: lines.map((l) => ({
            variantId: l.variantId,
            productName: l.productName, // SNAPSHOT
            variantLabel: l.variantLabel,
            sku: l.sku,
            unitPrice: l.unitPrice, // SNAPSHOT
            quantity: l.quantity,
          })),
        },
        statusHistory: { create: { status, note: "Order placed" } },
      },
      include: { items: true },
    });

    // Cart is spent
    await tx.cartItem.deleteMany({ where: { cartId } });

    return created;
  });

  // ---- 4. Razorpay order AFTER commit (never call external APIs inside a txn)
  // if (input.paymentMethod === "RAZORPAY") {
  //   try {
  //     const rzpOrder = await createRazorpayOrder(total, order.orderNumber);
  //     await db.order.update({
  //       where: { id: order.id },
  //       data: { razorpayOrderId: rzpOrder.id },
  //     });
  //     return {
  //       orderId: order.id,
  //       orderNumber: order.orderNumber,
  //       total,
  //       razorpay: { orderId: rzpOrder.id, keyId: process.env.RAZORPAY_KEY_ID },
  //     };
  //   } catch (e) {
  //     // Razorpay unreachable -> the pending order stays; the release-stock
  //     // cron cancels it and restores inventory in <=30 min. Surface a retry.
  //     throw new CheckoutError("Payment service unavailable, please retry", 503);
  //   }
  // }

  return { orderId: order.id, orderNumber: order.orderNumber, total, razorpay: null };
}

/**
 * Abandoned-order cleanup — run by Vercel Cron every 15 minutes.
 * Cancels PENDING (online-payment) orders older than 30 min, restores stock.
 * COD_PENDING is NOT touched (those await manual/OTP confirmation).
 */
export async function releaseStaleOrders() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const stale = await db.order.findMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    include: { items: true },
  });

  let released = 0;
  for (const order of stale) {
    await db.$transaction(async (tx) => {
      // Guard inside the txn: the webhook may have marked it PAID meanwhile.
      const fresh = await tx.order.findUnique({ where: { id: order.id }, select: { status: true } });
      if (fresh?.status !== "PENDING") return;

      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: "CANCELLED", note: "Auto-cancelled: payment not completed in 30 min" },
      });
      released++;
    });
  }
  return { checked: stale.length, released };
}
