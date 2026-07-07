import { db } from "@/lib/db";
import type { z } from "zod";
import type { productQuerySchema } from "@/lib/validation";

type ProductQuery = z.infer<typeof productQuerySchema>;

export async function listProducts(q: ProductQuery) {
  const where = {
    isActive: true,
    ...(q.category ? { category: q.category } : {}),
    ...(q.size ? { variants: { some: { size: q.size, stock: { gt: 0 } } } } : {}),
  };

  const orderBy =
    q.sort === "price_asc" ? { basePrice: "asc" as const }
    : q.sort === "price_desc" ? { basePrice: "desc" as const }
    : { createdAt: "desc" as const };

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.perPage,
      take: q.perPage,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { select: { size: true, stock: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return {
    items: items.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      price: p.basePrice,
      image: p.images[0]?.cloudinaryPublicId ?? null,
      inStock: p.variants.some((v) => v.stock > 0),
    })),
    total,
    page: q.page,
    pages: Math.ceil(total / q.perPage),
  };
}

export async function getProductBySlug(slug: string) {
  const p = await db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: {
        select: { id: true, sku: true, size: true, color: true, price: true, stock: true },
      },
    },
  });
  if (!p || !p.isActive) return null;

  return {
    ...p,
    variants: p.variants.map((v) => ({
      ...v,
      price: v.price ?? p.basePrice, // resolve inheritance server-side
      inStock: v.stock > 0,
      stock: undefined, // don't leak exact inventory to the storefront
      lowStock: v.stock > 0 && v.stock <= 5, // "only a few left" nudge
    })),
  };
}
