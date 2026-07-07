import { z } from "zod";
import { OrderStatus } from "@prisma/client";

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

export const adminOrderQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  userId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(24),
});

export const orderStatusUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().trim().max(280).optional(),
});

// ---------- admin: Cloudinary signed upload ----------

export const uploadSignSchema = z.object({
  folder: z.string().trim().regex(/^[a-zA-Z0-9/_-]+$/).max(100).default("qlothe/products"),
});
