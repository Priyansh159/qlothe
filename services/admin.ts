import { db } from "@/lib/db";
import { OrderStatus, Role, Prisma } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { assertRole, roleAtLeast } from "@/lib/rbac";
import { writeAudit, recentAuditEntries } from "@/services/audit";
import type { z } from "zod";
import type {
  productCreateSchema,
  productUpdateSchema,
  adminOrderQuerySchema,
  adminUserQuerySchema,
  staffCreateSchema,
  couponCreateSchema,
  couponUpdateSchema,
} from "@/lib/validation";

type ProductCreateInput = z.infer<typeof productCreateSchema>;
type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>;
type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;
type StaffCreateInput = z.infer<typeof staffCreateSchema>;
type CouponCreateInput = z.infer<typeof couponCreateSchema>;
type CouponUpdateInput = z.infer<typeof couponUpdateSchema>;

/** Every function below takes this as its first arg — resolved by requireRole() in the caller. */
export type Actor = { id: string; role: Role };

const BCRYPT_ROUNDS = 12;

class AdminError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// ---------- products (MANAGER) ----------

export async function createProduct(actor: Actor, input: ProductCreateInput) {
  assertRole(actor, "MANAGER", "create a product");
  try {
    const product = await db.product.create({
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
    await writeAudit(db, {
      actorId: actor.id,
      action: "product.created",
      entityType: "Product",
      entityId: product.id,
      after: { slug: product.slug, name: product.name, basePrice: product.basePrice, isActive: product.isActive },
    });
    return product;
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
 * Deactivate (isActive: false) is the only supported way to retire a product.
 */
export async function updateProduct(actor: Actor, id: string, input: ProductUpdateInput) {
  assertRole(actor, "MANAGER", "edit a product");

  const before = await db.product.findUnique({
    where: { id },
    select: { name: true, category: true, basePrice: true, isActive: true },
  });
  if (!before) throw new AdminError("Product not found", 404);

  try {
    const updated = await db.$transaction(async (tx) => {
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

      const full = await tx.product.findUniqueOrThrow({
        where: { id: updated.id },
        include: { variants: true, images: true },
      });

      await writeAudit(tx, {
        actorId: actor.id,
        action: "product.updated",
        entityType: "Product",
        entityId: id,
        before,
        after: { name: updated.name, category: updated.category, basePrice: updated.basePrice, isActive: updated.isActive },
      });

      return full;
    });
    return updated;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AdminError("A variant SKU already belongs to another product", 409);
    }
    throw e;
  }
}

export async function listProductsAdmin(actor: Actor) {
  assertRole(actor, "MANAGER", "view the product catalog");
  return db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { select: { id: true, stock: true } },
    },
  });
}

export async function getProductAdmin(actor: Actor, id: string) {
  assertRole(actor, "MANAGER", "view a product");
  return db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: [{ size: "asc" }, { color: "asc" }] },
    },
  });
}

// ---------- inventory (MANAGER) ----------

/**
 * Direct authoritative correction (e.g. after a physical stocktake) — NOT
 * the checkout decrement path, so it intentionally does not use the
 * gte-guarded updateMany pattern in services/checkout.ts (there is no
 * "someone else already took it" race to guard against here; the admin's
 * count IS the new truth). Always requires a reason, always audited.
 */
export async function adjustVariantStock(actor: Actor, variantId: string, newStock: number, reason: string) {
  assertRole(actor, "MANAGER", "adjust stock");

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, sku: true, stock: true },
  });
  if (!variant) throw new AdminError("Variant not found", 404);

  const updated = await db.$transaction(async (tx) => {
    const updated = await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: newStock },
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "variant.stock_adjusted",
      entityType: "ProductVariant",
      entityId: variantId,
      before: { stock: variant.stock },
      after: { stock: newStock, reason, sku: variant.sku },
    });
    return updated;
  });
  return updated;
}

// ---------- orders (MANAGER; SUPPORT: read + ship-status only) ----------

export async function listOrdersAdmin(actor: Actor, q: AdminOrderQuery) {
  assertRole(actor, "SUPPORT", "view orders");

  const where: Prisma.OrderWhereInput = {
    ...(q.status ? { status: q.status } : {}),
    ...(q.userId ? { userId: q.userId } : {}),
    ...(q.dateFrom || q.dateTo
      ? { createdAt: { ...(q.dateFrom ? { gte: q.dateFrom } : {}), ...(q.dateTo ? { lte: q.dateTo } : {}) } }
      : {}),
    ...(q.search
      ? {
          OR: [
            { orderNumber: { contains: q.search, mode: "insensitive" } },
            { user: { email: { contains: q.search, mode: "insensitive" } } },
            { user: { phone: { contains: q.search } } },
          ],
        }
      : {}),
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

/** Full detail for one order, no ownership filter — staff can view any customer's order. */
export async function getOrderAdmin(actor: Actor, orderId: string) {
  assertRole(actor, "SUPPORT", "view an order");
  return db.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, email: true, name: true, phone: true } },
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

// SUPPORT's write privilege is "ship-status only" — SHIPPED/DELIVERED. Every
// other transition (CONFIRMED, CANCELLED, REFUNDED) is money- or
// inventory-impacting and requires MANAGER+.
const SUPPORT_ALLOWED_TARGETS: OrderStatus[] = ["SHIPPED", "DELIVERED"];

// Stock is restored when an order that never shipped gets cancelled/refunded.
// SHIPPED/DELIVERED -> REFUNDED does NOT restore stock (goods already left).
const UNSHIPPED_STATUSES: OrderStatus[] = ["PENDING", "COD_PENDING", "PAID", "CONFIRMED"];

/** Exposed so the admin UI only ever offers status transitions the server will accept. */
export function allowedTransitions(status: OrderStatus): OrderStatus[] {
  return ADMIN_TRANSITIONS[status];
}

/** Same, but further filtered to what THIS actor's role is allowed to trigger. */
export function allowedTransitionsForRole(status: OrderStatus, role: Role): OrderStatus[] {
  const all = ADMIN_TRANSITIONS[status];
  if (roleAtLeast(role, "MANAGER")) return all;
  return all.filter((s) => SUPPORT_ALLOWED_TARGETS.includes(s));
}

export async function updateOrderStatus(
  actor: Actor,
  orderId: string,
  nextStatus: OrderStatus,
  note?: string,
  awbNumber?: string,
  courier?: string,
) {
  assertRole(actor, "SUPPORT", "change an order's status");
  if (!SUPPORT_ALLOWED_TARGETS.includes(nextStatus)) {
    assertRole(actor, "MANAGER", `move an order to ${nextStatus}`);
  }
  if (nextStatus === "SHIPPED" && (!awbNumber?.trim() || !courier?.trim())) {
    throw new AdminError("AWB number and courier are required to mark an order as shipped", 400);
  }

  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { select: { variantId: true, quantity: true } } },
    });
    if (!order) throw new AdminError("Order not found", 404);

    const allowed = ADMIN_TRANSITIONS[order.status];
    if (!allowed.includes(nextStatus)) {
      throw new AdminError(`Cannot move order from ${order.status} to ${nextStatus}`, 409);
    }

    const restoreStock = UNSHIPPED_STATUSES.includes(order.status) && (nextStatus === "CANCELLED" || nextStatus === "REFUNDED");
    if (restoreStock) {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    const res = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status: nextStatus,
        ...(nextStatus === "SHIPPED" ? { awbNumber: awbNumber!.trim(), courier: courier!.trim() } : {}),
      },
    });
    if (res.count === 0) {
      throw new AdminError("Order status changed concurrently, please retry", 409);
    }

    await tx.orderStatusHistory.create({
      data: { orderId, status: nextStatus, note },
    });

    await writeAudit(tx, {
      actorId: actor.id,
      action: "order.status_changed",
      entityType: "Order",
      entityId: orderId,
      before: { status: order.status },
      after: { status: nextStatus, note, awbNumber, courier, stockRestored: restoreStock },
    });

    return tx.order.findUniqueOrThrow({ where: { id: orderId } });
  });
}

// ---------- coupons (MANAGER) ----------

export async function listCouponsAdmin(actor: Actor) {
  assertRole(actor, "MANAGER", "view coupons");
  return db.coupon.findMany({ orderBy: { code: "asc" } });
}

export async function getCouponAdmin(actor: Actor, id: string) {
  assertRole(actor, "MANAGER", "view a coupon");
  return db.coupon.findUnique({ where: { id } });
}

export async function createCoupon(actor: Actor, input: CouponCreateInput) {
  assertRole(actor, "MANAGER", "create a coupon");
  try {
    const coupon = await db.coupon.create({ data: input });
    await writeAudit(db, {
      actorId: actor.id,
      action: "coupon.created",
      entityType: "Coupon",
      entityId: coupon.id,
      after: input,
    });
    return coupon;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AdminError("A coupon with this code already exists", 409);
    }
    throw e;
  }
}

export async function updateCoupon(actor: Actor, id: string, input: CouponUpdateInput) {
  assertRole(actor, "MANAGER", "edit a coupon");
  const before = await db.coupon.findUnique({ where: { id } });
  if (!before) throw new AdminError("Coupon not found", 404);

  const updated = await db.$transaction(async (tx) => {
    const updated = await tx.coupon.update({ where: { id }, data: input });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "coupon.updated",
      entityType: "Coupon",
      entityId: id,
      before: { type: before.type, value: before.value, isActive: before.isActive, maxUses: before.maxUses, expiresAt: before.expiresAt },
      after: input,
    });
    return updated;
  });
  return updated;
}

// ---------- users & staff (ADMIN) ----------

export async function listUsersAdmin(actor: Actor, q: AdminUserQuery) {
  assertRole(actor, "ADMIN", "view users");

  const where: Prisma.UserWhereInput = {
    ...(q.role ? { role: q.role } : {}),
    ...(q.search
      ? {
          OR: [
            { email: { contains: q.search, mode: "insensitive" } },
            { name: { contains: q.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.perPage,
      take: q.perPage,
      select: {
        id: true, email: true, name: true, role: true, createdAt: true, mustChangePassword: true,
        _count: { select: { orders: true } },
      },
    }),
    db.user.count({ where }),
  ]);
  return { items, total, page: q.page, pages: Math.ceil(total / q.perPage) };
}

export async function getUserAdmin(actor: Actor, id: string) {
  assertRole(actor, "ADMIN", "view a user");
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true, mustChangePassword: true },
  });
  if (!user) return null;

  const orders = await db.order.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, orderNumber: true, status: true, total: true, createdAt: true,
      items: { select: { productName: true, variantLabel: true, quantity: true } },
    },
  });

  return { user, orders };
}

export async function updateUserRole(actor: Actor, targetUserId: string, newRole: Role) {
  assertRole(actor, "ADMIN", "change a user's role");
  if (targetUserId === actor.id) {
    throw new AdminError("You cannot change your own role", 400);
  }

  const target = await db.user.findUnique({ where: { id: targetUserId }, select: { role: true } });
  if (!target) throw new AdminError("User not found", 404);

  if (target.role === "ADMIN" && newRole !== "ADMIN") {
    const otherAdmins = await db.user.count({ where: { role: "ADMIN", id: { not: targetUserId } } });
    if (otherAdmins === 0) {
      throw new AdminError("Cannot demote the last remaining admin", 400);
    }
  }

  const updated = await db.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, email: true, name: true, role: true },
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "user.role_changed",
      entityType: "User",
      entityId: targetUserId,
      before: { role: target.role },
      after: { role: newRole },
    });
    return updated;
  });
  return updated;
}

/** Creates a SUPPORT/MANAGER/ADMIN account with a temp password shown exactly once. */
export async function createStaffUser(actor: Actor, input: StaffCreateInput) {
  assertRole(actor, "ADMIN", "create a staff account");

  const existing = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new AdminError("An account with this email already exists", 409);

  const tempPassword = input.tempPassword ?? crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

  const user = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: input.email, name: input.name, role: input.role, passwordHash, mustChangePassword: true },
      select: { id: true, email: true, name: true, role: true },
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "user.staff_created",
      entityType: "User",
      entityId: user.id,
      after: { email: user.email, name: user.name, role: user.role }, // never the password
    });
    return user;
  });

  return { ...user, tempPassword };
}

// ---------- dashboard (SUPPORT+) ----------

// "Today"/"this week" are business-facing numbers for an India-only D2C
// store, so they're bucketed in IST (UTC+5:30, no DST) rather than the
// server's local time (Vercel runs UTC, which would roll "today" over at
// 5:30am IST — misleading for a same-day sales number).
function startOfTodayIST(): Date {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istNow = Date.now() + IST_OFFSET_MS;
  const istMidnight = Math.floor(istNow / 86_400_000) * 86_400_000;
  return new Date(istMidnight - IST_OFFSET_MS);
}

// Orders that are still PENDING (unpaid) or CANCELLED never happened from a
// revenue standpoint; REFUNDED reverses itself. Everything else — including
// COD_PENDING, a real commitment awaiting delivery — counts.
const REVENUE_STATUSES: OrderStatus[] = ["COD_PENDING", "PAID", "CONFIRMED", "SHIPPED", "DELIVERED"];

export async function getDashboardStats(actor: Actor) {
  assertRole(actor, "SUPPORT", "view the dashboard");

  const todayStart = startOfTodayIST();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

  const [todayAgg, weekAgg, codPendingCount, stalePendingCount, lowStockVariants] = await Promise.all([
    db.order.aggregate({
      where: { createdAt: { gte: todayStart }, status: { in: REVENUE_STATUSES } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    db.order.aggregate({
      where: { createdAt: { gte: sevenDaysAgo }, status: { in: REVENUE_STATUSES } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    db.order.count({ where: { status: "COD_PENDING" } }),
    db.order.count({ where: { status: "PENDING", createdAt: { lt: fifteenMinAgo } } }),
    db.productVariant.findMany({
      where: { stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 20,
      select: {
        id: true, sku: true, size: true, color: true, stock: true,
        product: { select: { name: true, slug: true } },
      },
    }),
  ]);

  return {
    today: { orders: todayAgg._count._all, revenue: todayAgg._sum.total ?? 0 },
    last7Days: { orders: weekAgg._count._all, revenue: weekAgg._sum.total ?? 0 },
    codPendingCount,
    stalePendingCount,
    lowStockVariants,
    // Audit visibility is ADMIN-only (it can reveal staff role changes etc.),
    // even though the dashboard itself is visible to all staff.
    recentAudit: roleAtLeast(actor.role, "ADMIN") ? await recentAuditEntries(8) : null,
  };
}
