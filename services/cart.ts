import { db } from "@/lib/db";

/**
 * Cart resolution order:
 *  1. logged-in user's cart (by userId)
 *  2. guest cart (by cookie token = cart id)
 *  3. create new
 * On login, call mergeGuestCart() to fold the guest cart into the user's.
 */
export async function getOrCreateCart(userId: string | null, cartToken?: string) {
  if (userId) {
    const existing = await db.cart.findFirst({ where: { userId } });
    if (existing) return existing;
    return db.cart.create({ data: { userId } });
  }
  if (cartToken) {
    const existing = await db.cart.findUnique({ where: { id: cartToken } });
    if (existing && !existing.userId) return existing;
  }
  return db.cart.create({ data: {} });
}

export async function getCartWithItems(cartId: string) {
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: { name: true, slug: true, basePrice: true, isActive: true,
                          images: { orderBy: { sortOrder: "asc" }, take: 1 } },
              },
            },
          },
        },
      },
    },
  });
  if (!cart) return null;

  const items = cart.items
    .filter((i) => i.variant.product.isActive)
    .map((i) => {
      const unitPrice = i.variant.price ?? i.variant.product.basePrice;
      return {
        id: i.id,
        variantId: i.variantId,
        name: i.variant.product.name,
        slug: i.variant.product.slug,
        image: i.variant.product.images[0]?.cloudinaryPublicId ?? null,
        label: `${i.variant.color} / ${i.variant.size}`,
        unitPrice,
        quantity: i.quantity,
        lineTotal: unitPrice * i.quantity,
        available: i.variant.stock >= i.quantity,
      };
    });

  return {
    id: cart.id,
    items,
    subtotal: items.reduce((s, i) => s + i.lineTotal, 0),
  };
}

export async function addItem(cartId: string, variantId: string, quantity: number) {
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    select: { stock: true, product: { select: { isActive: true } } },
  });
  if (!variant || !variant.product.isActive) {
    throw Object.assign(new Error("Product unavailable"), { status: 404 });
  }
  // Upsert: adding the same variant again increments quantity.
  return db.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity },
    update: { quantity: { increment: quantity } },
  });
}

export async function updateItemQuantity(cartId: string, variantId: string, quantity: number) {
  if (quantity <= 0) {
    return db.cartItem.deleteMany({ where: { cartId, variantId } });
  }
  return db.cartItem.update({
    where: { cartId_variantId: { cartId, variantId } },
    data: { quantity },
  });
}

/** Fold a guest cart into the user's cart at login. */
export async function mergeGuestCart(guestCartId: string, userId: string) {
  const userCart = await getOrCreateCart(userId);
  const guestItems = await db.cartItem.findMany({ where: { cartId: guestCartId } });
  for (const item of guestItems) {
    await db.cartItem.upsert({
      where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
      create: { cartId: userCart.id, variantId: item.variantId, quantity: item.quantity },
      update: { quantity: { increment: item.quantity } },
    });
  }
  await db.cart.delete({ where: { id: guestCartId } }).catch(() => {});
  return userCart.id;
}
