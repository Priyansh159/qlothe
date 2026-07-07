import { db } from "@/lib/db";
import { OrderStatus, Prisma } from "@prisma/client";
import type { z } from "zod";
import type { productCreateSchema, productUpdateSchema, adminOrderQuerySchema } from "@/lib/validation";

type ProductCreateInput = z.infer<typeof productCreateSchema>;
type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>;

class AdminError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function createProduct(input: ProductCreateInput) {
  try {
    return await db.product.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        category: input.category,
        basePrice: input.basePrice,
        attributes: input.attributes as Prisma.InputJsonValue,
        isActive: input.isActive,
        variants: {
          create: input.variants.map((v) => ({
            sku: v.sku,
            size: v.size,
            color: v.color,
            price: v.price ?? null,
            stock: v.stock,
          })),
        },
        images: {
          create: input.images.map((img) => ({
            cloudinaryPublicId: img.cloudinaryPublicId,
            sortOrder: img.sortOrder,
          })),
        },
      },
      include: { variants: true, images: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AdminError("Product slug or a variant SKU already exists", 409);
    }
    throw e;
  }
}

/**
 * Variants/images are upserted by their natural unique key (sku / cloudinaryPublicId).
 * Existing rows not mentioned in the payload are left untouched — variants can't be
 * silently deleted here because order_items may still reference them (FK + legal record).
 */
export async function updateProduct(id: string, input: ProductUpdateInput) {
  const product = await db.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) throw new AdminError("Product not found", 404);

  try {
    return await db.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          category: input.category,
          basePrice: input.basePrice,
          attributes: input.attributes as Prisma.InputJsonValue | undefined,
          isActive: input.isActive,
        },
      });

      if (input.variants) {
        for (const v of input.variants) {
          await tx.productVariant.upsert({
            where: { sku: v.sku },
            create: { productId: id, sku: v.sku, size: v.size, color: v.color, price: v.price ?? null, stock: v.stock },
            update: { size: v.size, color: v.color, price: v.price ?? null, stock: v.stock },
          });
        }
      }

      if (input.images) {
        for (const img of input.images) {
          if (img.id) {
            // Scoped by productId too, so an id typo can't touch another product's image.
            const res = await tx.productImage.updateMany({
              where: { id: img.id, productId: id },
              data: { cloudinaryPublicId: img.cloudinaryPublicId, sortOrder: img.sortOrder },
            });
            if (res.count === 0) throw new AdminError(`Image ${img.id} not found on this product`, 404);
          } else {
            await tx.productImage.create({
              data: { productId: id, cloudinaryPublicId: img.cloudinaryPublicId, sortOrder: img.sortOrder },
            });
          }
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id: updated.id },
        include: { variants: true, images: true },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AdminError("A variant SKU already belongs to another product", 409);
    }
    throw e;
  }
}

export async function listOrdersAdmin(q: AdminOrderQuery) {
  const where = {
    ...(q.status ? { status: q.status } : {}),
    ...(q.userId ? { userId: q.userId } : {}),
  };
  const [items, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.perPage,
      take: q.perPage,
      select: {
        id: true, orderNumber: true, status: true, total: true, paymentMethod: true,
        createdAt: true, userId: true,
        user: { select: { email: true, name: true } },
        items: { select: { productName: true, variantLabel: true, quantity: true } },
      },
    }),
    db.order.count({ where }),
  ]);
  return { items, total, page: q.page, pages: Math.ceil(total / q.perPage) };
}

/** Full detail for one order, no ownership filter — admin can view any customer's order. */
export async function getOrderAdmin(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, email: true, name: true } },
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "asc" } },
    },
  });
}

// The state machine from CLAUDE.md: PENDING -> PAID -> CONFIRMED -> SHIPPED -> DELIVERED
// (+ COD_PENDING, CANCELLED, REFUNDED). PENDING -> PAID is owned exclusively by the
// Razorpay webhook, so it is deliberately absent from every admin-reachable list below.
const ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CANCELLED"],
  COD_PENDING: ["CONFIRMED", "CANCELLED"],
  PAID: ["CONFIRMED", "CANCELLED", "REFUNDED"],
  CONFIRMED: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

/** Exposed so the admin UI only ever offers status transitions the server will accept. */
export function allowedTransitions(status: OrderStatus): OrderStatus[] {
  return ADMIN_TRANSITIONS[status];
}

export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus, note?: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!order) throw new AdminError("Order not found", 404);

    const allowed = ADMIN_TRANSITIONS[order.status];
    if (!allowed.includes(nextStatus)) {
      throw new AdminError(`Cannot move order from ${order.status} to ${nextStatus}`, 409);
    }

    const res = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: nextStatus },
    });
    if (res.count === 0) {
      throw new AdminError("Order status changed concurrently, please retry", 409);
    }

    await tx.orderStatusHistory.create({
      data: { orderId, status: nextStatus, note },
    });

    return tx.order.findUniqueOrThrow({ where: { id: orderId } });
  });
}

// ---------- products (admin views: unresolved prices, exact stock, inactive included) ----------

export async function listProductsAdmin() {
  return db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { select: { id: true, stock: true } },
    },
  });
}

export async function getProductAdmin(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: [{ size: "asc" }, { color: "asc" }] },
    },
  });
}

// ---------- users ----------

export async function listUsersAdmin() {
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, email: true, name: true, role: true, createdAt: true,
      _count: { select: { orders: true } },
    },
  });
}
