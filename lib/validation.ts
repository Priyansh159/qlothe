import { z } from "zod";
import { OrderStatus, Role, CouponType } from "@prisma/client";

export const productQuerySchema = z.object({
  category: z.string().trim().max(60).optional(),
  size: z.string().trim().max(10).optional(),
  sort: z.enum(["new", "price_asc", "price_desc"]).default("new"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(48).default(24),
});

export const cartItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
});

// PATCH allows 0 = remove the item
export const cartUpdateSchema = cartItemSchema.extend({
  quantity: z.number().int().min(0).max(10),
});

export const addressSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "10-digit Indian mobile"),
  line1: z.string().trim().min(3).max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z.string().trim().regex(/^\d{6}$/),
});

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  address: addressSchema, // snapshotted onto the order as JSON
  couponCode: z.string().trim().toUpperCase().max(30).optional(),
});

// ---------- auth ----------

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(8).max(72), // bcrypt truncates beyond 72 bytes
  name: z.string().trim().min(1).max(80).optional(),
});

// ---------- account (self-service profile) ----------

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "10-digit Indian mobile").optional(),
});

export const emailChangeRequestSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email().max(120),
});

// currentPassword is required by the service whenever the account already
// has a password set — enforced there, not here, since that depends on DB
// state (OAuth-only accounts have nothing to "confirm").
export const passwordChangeSelfSchema = z.object({
  currentPassword: z.string().max(72).optional(),
  newPassword: z.string().min(8).max(72),
});

// ---------- admin: products ----------

export const productVariantInputSchema = z.object({
  sku: z.string().trim().min(1).max(60),
  size: z.string().trim().min(1).max(10),
  color: z.string().trim().min(1).max(40),
  price: z.number().int().min(0).nullable().optional(), // paise; null = inherit basePrice
  stock: z.number().int().min(0).default(0),
});

export const productImageInputSchema = z.object({
  id: z.string().uuid().optional(), // present = update that row, absent = create a new one
  cloudinaryPublicId: z.string().trim().min(1).max(200),
  sortOrder: z.number().int().min(0).default(0),
});

export const productCreateSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).max(120),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional(),
  category: z.string().trim().min(1).max(60),
  basePrice: z.number().int().min(0), // paise
  attributes: z.record(z.string(), z.unknown()).default({}),
  isActive: z.boolean().default(true),
  variants: z.array(productVariantInputSchema).min(1),
  images: z.array(productImageInputSchema).default([]),
});

// All fields optional on update; variants/images, when present, are upserted by sku/id.
export const productUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(4000).optional(),
  category: z.string().trim().min(1).max(60).optional(),
  basePrice: z.number().int().min(0).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
  variants: z.array(productVariantInputSchema).optional(),
  images: z.array(productImageInputSchema).optional(),
});

// ---------- admin: orders ----------

export const adminOrderQuerySchema = z
  .object({
    status: z.nativeEnum(OrderStatus).optional(),
    userId: z.string().uuid().optional(),
    // Free-text: matches orderNumber, or the customer's email/phone.
    search: z.string().trim().min(1).max(120).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(24),
  })
  .refine((v) => !v.dateFrom || !v.dateTo || v.dateFrom <= v.dateTo, {
    message: "dateFrom must be before dateTo",
    path: ["dateTo"],
  });

export const orderStatusUpdateSchema = z
  .object({
    status: z.nativeEnum(OrderStatus),
    note: z.string().trim().max(280).optional(),
    // Only meaningful (and required) when status === "SHIPPED" — see the
    // refine below and the authoritative re-check in services/admin.ts.
    awbNumber: z.string().trim().min(1).max(60).optional(),
    courier: z.string().trim().min(1).max(60).optional(),
  })
  .refine((v) => v.status !== "SHIPPED" || (!!v.awbNumber && !!v.courier), {
    message: "AWB number and courier are required to mark an order as shipped",
    path: ["awbNumber"],
  });

// ---------- admin: users & staff ----------

export const adminUserQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(), // matches email or name
  role: z.nativeEnum(Role).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(24),
});

export const userRoleUpdateSchema = z.object({
  role: z.nativeEnum(Role),
});

// Staff accounts only — CUSTOMER is excluded, that role is what public
// registration already produces and isn't something an admin needs to grant.
export const staffCreateSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  name: z.string().trim().min(1).max(80),
  role: z.enum(["SUPPORT", "MANAGER", "ADMIN"]),
  // If omitted, the server generates one and returns it exactly once.
  tempPassword: z.string().min(8).max(72).optional(),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8).max(72),
});

// ---------- admin: coupons ----------

export const couponCreateSchema = z
  .object({
    code: z.string().trim().toUpperCase().min(3).max(30).regex(/^[A-Z0-9-]+$/),
    type: z.nativeEnum(CouponType),
    value: z.number().int().min(1), // PERCENT: 1-100 · FLAT: paise
    minOrder: z.number().int().min(0).default(0),
    maxUses: z.number().int().min(1).nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .refine((v) => v.type !== "PERCENT" || v.value <= 100, {
    message: "A PERCENT coupon's value must be between 1 and 100",
    path: ["value"],
  });

export const couponUpdateSchema = z
  .object({
    type: z.nativeEnum(CouponType).optional(),
    value: z.number().int().min(1).optional(),
    minOrder: z.number().int().min(0).optional(),
    maxUses: z.number().int().min(1).nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.type !== "PERCENT" || v.value === undefined || v.value <= 100, {
    message: "A PERCENT coupon's value must be between 1 and 100",
    path: ["value"],
  });

// ---------- admin: inventory ----------

export const variantStockAdjustSchema = z.object({
  stock: z.number().int().min(0),
  reason: z.string().trim().min(1).max(280),
});

// ---------- admin: Cloudinary signed upload ----------

export const uploadSignSchema = z.object({
  folder: z.string().trim().regex(/^[a-zA-Z0-9/_-]+$/).max(100).default("qlothe/products"),
});
