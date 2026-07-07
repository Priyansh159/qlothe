import { db } from "@/lib/db";

export async function listUserOrders(userId: string) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, orderNumber: true, status: true, total: true, createdAt: true,
      items: { select: { productName: true, variantLabel: true, quantity: true } },
    },
  });
}

export async function getUserOrder(userId: string, orderId: string) {
  // userId in the WHERE = ownership check. Never fetch by id alone.
  return db.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      payments: { select: { status: true, razorpayPaymentId: true, createdAt: true } },
    },
  });
}
